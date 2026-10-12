<?php

declare(strict_types=1);

/**
 * Mercado Pago Checkout Pro for FOSSBilling (one-time payments, CLP).
 *
 * Flow: getHtml() creates a preference and sends the client to Mercado Pago. The
 * client comes back through redirect_url (ipn.php?...&redirect=1, Mercado Pago adds
 * payment_id) and Mercado Pago also posts webhooks to notify_url. In both cases the
 * payment is re-read from the Mercado Pago API, so request payloads are never trusted.
 *
 * Install: copy to library/Payment/Adapter/MercadoPago.php (see install-mercadopago.sh).
 */
class Payment_Adapter_MercadoPago implements FOSSBilling\InjectionAwareInterface
{
    private const string API = 'https://api.mercadopago.com';

    protected ?Pimple\Container $di = null;

    public function __construct(private $config)
    {
        if (empty($this->accessToken())) {
            throw new Payment_Exception('The ":pay_gateway" payment gateway is not fully configured. Please configure the :missing', [
                ':pay_gateway' => 'Mercado Pago',
                ':missing' => !empty($this->config['test_mode']) ? 'Test Access Token' : 'Access Token',
            ], 4001);
        }
    }

    public function setDi(Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?Pimple\Container
    {
        return $this->di;
    }

    public static function getConfig(): array
    {
        return [
            'supports_one_time_payments' => true,
            'supports_subscriptions' => false,
            'description' => 'Mercado Pago Checkout Pro. Usa el Access Token de tu aplicación en https://www.mercadopago.cl/developers/panel/app (Credenciales de producción / de prueba).',
            'logo' => [
                'logo' => 'mercadopago.png',
                'height' => '30px',
                'width' => '100px',
            ],
            'form' => [
                'access_token' => [
                    'password', [
                        'label' => 'Access Token de producción (APP_USR-...):',
                        'required_when' => ['enabled' => true, 'test_mode' => false],
                        'secret' => true,
                    ],
                ],
                'test_access_token' => [
                    'password', [
                        'label' => 'Access Token de prueba (TEST-... o de usuario de prueba):',
                        'required_when' => ['enabled' => true, 'test_mode' => true],
                        'secret' => true,
                    ],
                ],
                'statement_descriptor' => [
                    'text', [
                        'label' => 'Nombre en el resumen de la tarjeta (opcional, máx. 22):',
                        'required' => false,
                    ],
                ],
            ],
        ];
    }

    public function getHtml(FOSSBilling\Api\Proxy $api_admin, int $invoice_id, bool $subscription): string
    {
        $invoice = $this->di['db']->getExistingModelById('Invoice', $invoice_id);
        $invoiceService = $this->di['mod_service']('Invoice');
        $amount = $this->toMercadoPagoAmount($invoiceService->getTotalWithTax($invoice), (string) $invoice->currency);

        $payer = ['email' => (string) $invoice->buyer_email];
        if (!empty($invoice->buyer_first_name)) {
            $payer['name'] = (string) $invoice->buyer_first_name;
        }
        if (!empty($invoice->buyer_last_name)) {
            $payer['surname'] = (string) $invoice->buyer_last_name;
        }

        $preference = [
            'items' => [[
                'id' => 'invoice-' . $invoice->id,
                'title' => $this->getInvoiceTitle($invoice),
                'quantity' => 1,
                'currency_id' => strtoupper((string) $invoice->currency),
                'unit_price' => $amount,
            ]],
            'payer' => $payer,
            'external_reference' => $this->externalReference((int) $invoice->id),
            'notification_url' => $this->config['notify_url'],
            'back_urls' => [
                'success' => $this->config['redirect_url'],
                'pending' => $this->config['redirect_url'],
                'failure' => $this->config['redirect_url'],
            ],
            'auto_return' => 'approved',
            'metadata' => [
                'invoice_id' => (int) $invoice->id,
                'gateway_id' => (int) $this->config['gateway_id'],
            ],
        ];
        $descriptor = trim((string) ($this->config['statement_descriptor'] ?? ''));
        if ($descriptor !== '') {
            $preference['statement_descriptor'] = mb_substr($descriptor, 0, 22);
        }

        try {
            $result = $this->request('POST', '/checkout/preferences', $preference);
        } catch (Throwable $e) {
            $this->di['logger']->error('Mercado Pago preference for invoice %s failed: %s', $invoice->id, $e->getMessage());

            return '<div class="alert alert-danger">' . htmlspecialchars(__trans('No pudimos iniciar el pago con Mercado Pago. Intenta nuevamente en unos minutos.')) . '</div>';
        }

        $url = !empty($this->config['test_mode']) && !empty($result['sandbox_init_point'])
            ? (string) $result['sandbox_init_point']
            : (string) ($result['init_point'] ?? '');
        if ($url === '') {
            return '<div class="alert alert-danger">' . htmlspecialchars(__trans('No pudimos iniciar el pago con Mercado Pago. Intenta nuevamente en unos minutos.')) . '</div>';
        }

        $href = htmlspecialchars($url, ENT_QUOTES);
        $html = '<div class="mercadopago-checkout">'
            . '<p>' . htmlspecialchars(__trans('Paga con tarjeta de débito, crédito o saldo en Mercado Pago.')) . '</p>'
            . '<a class="btn btn-primary" href="' . $href . '">' . htmlspecialchars(__trans('Pagar con Mercado Pago')) . '</a>'
            . '</div>';

        if (!empty($this->config['auto_redirect'])) {
            $html .= '<script>window.location.href = ' . json_encode($url, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES) . ';</script>';
        }

        return $html;
    }

    public function processTransaction(FOSSBilling\Api\Proxy $api_admin, int $id, array $data, int $gateway_id): void
    {
        $tx = $this->di['db']->getExistingModelById('Transaction', $id);

        $paymentId = $this->extractPaymentId($data);
        if ($paymentId === null) {
            // merchant_order and other topics carry no payment to apply.
            $this->di['db']->trash($tx);

            return;
        }

        $payment = $this->request('GET', '/v1/payments/' . rawurlencode($paymentId));
        $invoiceId = $this->invoiceIdFromReference((string) ($payment['external_reference'] ?? ''), $gateway_id);
        if ($invoiceId === null) {
            // Payment from another integration on the same Mercado Pago account.
            $this->di['db']->trash($tx);

            return;
        }
        if ($tx->invoice_id && (int) $tx->invoice_id !== $invoiceId) {
            throw new Payment_Exception('Mercado Pago payment does not belong to this invoice');
        }

        $this->withLock($paymentId, $gateway_id, fn () => $this->applyPayment($tx, $payment, $invoiceId, $gateway_id));
    }

    private function applyPayment(Model_Transaction $tx, array $payment, int $invoiceId, int $gatewayId): void
    {
        $paymentId = (string) $payment['id'];
        $status = (string) ($payment['status'] ?? '');

        $tx->invoice_id = $invoiceId;
        $tx->txn_id = $paymentId;
        $tx->txn_status = $status . (!empty($payment['status_detail']) ? ' (' . $payment['status_detail'] . ')' : '');
        $tx->amount = (float) ($payment['transaction_amount'] ?? 0);
        $tx->currency = strtoupper((string) ($payment['currency_id'] ?? ''));
        $tx->type = Payment_Transaction::TXTYPE_PAYMENT;
        $tx->updated_at = date('Y-m-d H:i:s');

        // Redirect + webhook (and Mercado Pago retries) all report the same payment.
        $existing = $this->di['db']->findOne(
            'Transaction',
            'txn_id = :txn_id AND gateway_id = :gateway_id AND id != :id AND status IN (:s1, :s2)',
            [
                ':txn_id' => $paymentId,
                ':gateway_id' => $gatewayId,
                ':id' => $tx->id,
                ':s1' => Model_Transaction::STATUS_PROCESSING,
                ':s2' => Model_Transaction::STATUS_PROCESSED,
            ]
        );
        if ($existing instanceof Model_Transaction) {
            $this->di['db']->trash($tx);

            return;
        }

        if ($status !== 'approved') {
            $tx->status = in_array($status, ['pending', 'in_process', 'authorized'], true)
                ? Model_Transaction::STATUS_RECEIVED
                : Model_Transaction::STATUS_ERROR;
            if ($tx->status === Model_Transaction::STATUS_ERROR) {
                $tx->error = 'Mercado Pago: ' . $tx->txn_status;
            }
            $this->di['db']->store($tx);

            return;
        }

        $invoiceService = $this->di['mod_service']('Invoice');
        $invoice = $this->di['db']->getExistingModelById('Invoice', $invoiceId);

        if (strcasecmp($tx->currency, (string) $invoice->currency) !== 0) {
            throw new Payment_Exception('Mercado Pago payment currency does not match invoice currency');
        }

        if ($invoice->status === Model_Invoice::STATUS_PAID) {
            $tx->status = Model_Transaction::STATUS_PROCESSED;
            $this->di['db']->store($tx);

            return;
        }

        $invoiceService->validatePaymentAmount((float) $tx->amount, $invoiceService->getTotalWithTax($invoice));

        $this->di['db']->store($tx);
        $transactionService = $this->di['mod_service']('Invoice', 'Transaction');
        if (!$transactionService->claimForProcessing((int) $tx->id)) {
            return;
        }

        $client = $this->di['db']->getExistingModelById('Client', $invoice->client_id);
        $this->di['mod_service']('client')->addFunds($client, $tx->amount, 'Mercado Pago pago ' . $paymentId, [
            'type' => 'transaction',
            'rel_id' => $tx->id,
        ]);

        if ($invoiceService->isInvoiceTypeDeposit($invoice)) {
            $invoiceService->markAsPaid($invoice);
        } else {
            if (!$invoice->approved) {
                $invoiceService->approveInvoice($invoice, ['use_credits' => false]);
            }
            $invoiceService->payInvoiceWithCredits($invoice);
        }

        $tx->status = Model_Transaction::STATUS_PROCESSED;
        $tx->updated_at = date('Y-m-d H:i:s');
        $this->di['db']->store($tx);
    }

    /**
     * Return redirect: ?payment_id= (or collection_id=). Webhook: ?data.id=&type=payment
     * (PHP turns the dot into data_id) or JSON {"type":"payment","data":{"id":...}}.
     * Legacy IPN: ?topic=payment&id=.
     */
    private function extractPaymentId(array $data): ?string
    {
        $get = is_array($data['get'] ?? null) ? $data['get'] : [];
        $body = json_decode((string) ($data['http_raw_post_data'] ?? ''), true);
        $body = is_array($body) ? $body : [];

        $type = $get['type'] ?? $get['topic'] ?? $body['type'] ?? $body['topic'] ?? null;
        $candidates = [
            $get['payment_id'] ?? null,
            $get['collection_id'] ?? null,
            $type === 'payment' ? ($get['data_id'] ?? $body['data']['id'] ?? $get['id'] ?? null) : null,
        ];
        foreach ($candidates as $candidate) {
            if (is_scalar($candidate) && preg_match('/^\d{1,20}$/', (string) $candidate)) {
                return (string) $candidate;
            }
        }

        return null;
    }

    private function externalReference(int $invoiceId): string
    {
        return sprintf('fb-%d-%d', (int) $this->config['gateway_id'], $invoiceId);
    }

    private function invoiceIdFromReference(string $reference, int $gatewayId): ?int
    {
        if (!preg_match('/^fb-(\d+)-(\d+)$/', $reference, $m) || (int) $m[1] !== $gatewayId) {
            return null;
        }

        return (int) $m[2];
    }

    private function toMercadoPagoAmount(float $amount, string $currency): float|int
    {
        // CLP (and COP) take whole units; Mercado Pago rejects decimals for them.
        return in_array(strtoupper($currency), ['CLP', 'COP'], true) ? (int) round($amount) : round($amount, 2);
    }

    private function getInvoiceTitle(Model_Invoice $invoice): string
    {
        $items = $this->di['db']->getAll('SELECT title FROM invoice_item WHERE invoice_id = :id', [':id' => $invoice->id]);
        $params = [
            ':id' => sprintf('%05s', $invoice->nr),
            ':serie' => $invoice->serie,
            ':title' => $items[0]['title'] ?? '',
        ];

        $title = FOSSBilling\Tools::safeCount($items) > 1
            ? __trans('Payment for invoice :serie:id', $params)
            : __trans('Payment for invoice :serie:id [:title]', $params);

        return mb_substr($title, 0, 250);
    }

    private function accessToken(): string
    {
        return trim((string) (!empty($this->config['test_mode'])
            ? ($this->config['test_access_token'] ?? '')
            : ($this->config['access_token'] ?? '')));
    }

    private function request(string $method, string $path, ?array $json = null): array
    {
        $options = [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken(),
                'Accept' => 'application/json',
            ],
            'timeout' => 20,
        ];
        if ($json !== null) {
            $options['json'] = $json;
            $options['headers']['X-Idempotency-Key'] = hash('sha256', $path . json_encode($json));
        }

        $response = $this->di['http_client']->request($method, self::API . $path, $options);
        $status = $response->getStatusCode();
        $body = json_decode($response->getContent(false), true);
        if ($status >= 300 || !is_array($body)) {
            $message = is_array($body) ? ($body['message'] ?? $body['error'] ?? 'unknown error') : 'invalid response';

            throw new Payment_Exception('Mercado Pago API :status: :message', [':status' => $status, ':message' => (string) $message]);
        }

        return $body;
    }

    private function withLock(string $paymentId, int $gatewayId, callable $callback): mixed
    {
        $lockName = 'fb:mercadopago:' . substr(hash('sha256', $gatewayId . ':' . $paymentId), 0, 48);
        $acquired = (int) $this->di['dbal']->fetchOne('SELECT GET_LOCK(:name, 10)', ['name' => $lockName]);
        if ($acquired !== 1) {
            throw new FOSSBilling\Exception('Timed out waiting to process this Mercado Pago payment');
        }

        try {
            return $callback();
        } finally {
            $this->di['dbal']->fetchOne('SELECT RELEASE_LOCK(:name)', ['name' => $lockName]);
        }
    }
}
