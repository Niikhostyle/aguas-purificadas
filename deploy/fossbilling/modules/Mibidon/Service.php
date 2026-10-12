<?php

declare(strict_types=1);
/**
 * MiBidón ↔ FOSSBilling bridge.
 *
 * Listens to order lifecycle events of the MiBidón plan product(s) and calls the
 * MiBidón platform endpoint (POST /api/platform/provision, HMAC-SHA256 signed) to
 * create, suspend, reactivate and cancel the tenant store <slug>.mibidon.cl.
 */

namespace Box\Mod\Mibidon;

use FOSSBilling\InjectionAwareInterface;
use FOSSBilling\Interfaces\WidgetProviderInterface;
use Symfony\Contracts\Cache\ItemInterface;

class Service implements InjectionAwareInterface, WidgetProviderInterface
{
    public const META_EXTENSION = 'mod_mibidon';
    public const META_REL_TYPE = 'client_order';
    public const META_KEY = 'store';
    private const RECONCILE_EVERY_SECONDS = 3600;

    protected ?\Pimple\Container $di = null;

    public function setDi(\Pimple\Container $di): void
    {
        $this->di = $di;
    }

    public function getDi(): ?\Pimple\Container
    {
        return $this->di;
    }

    public function getModulePermissions(): array
    {
        return [
            'manage' => [
                'type' => 'bool',
                'display_name' => __trans('Manage MiBidón stores'),
                'description' => __trans('Allows the staff member to re-sync MiBidón stores with their orders.'),
            ],
            'manage_settings' => [],
        ];
    }

    public function install(): bool
    {
        return true;
    }

    public function uninstall(): bool
    {
        return true;
    }

    public function getWidgets(): array
    {
        return [
            [
                'slot' => 'client.order.manage.details.after',
                'template' => 'mod_mibidon_order_store',
                'priority' => 5,
            ],
        ];
    }

    /*
     * ---------------------------------------------------------------------
     * Event hooks (connected automatically by mod_hook when the module is active)
     * ---------------------------------------------------------------------
     */

    public static function onAfterAdminOrderActivate(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'create');
    }

    public static function onAfterAdminOrderSuspend(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'suspend');
    }

    public static function onAfterAdminOrderUnsuspend(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'unsuspend');
    }

    public static function onAfterAdminOrderUncancel(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'unsuspend');
    }

    public static function onAfterAdminOrderCancel(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'cancel');
    }

    public static function onAfterAdminOrderRenew(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'renew');
    }

    /** onAfterAdminOrderDelete fires once the row is gone, so cancel the store before. */
    public static function onBeforeAdminOrderDelete(\Box_Event $event): void
    {
        self::dispatchOrderEvent($event, 'cancel');
    }

    /** Batch jobs (cron: suspend expired, cancel suspended/unpaid) skip per-order events. */
    public static function onAfterAdminBatchSuspendOrders(\Box_Event $event): void
    {
        self::runReconcile($event, true);
    }

    public static function onAfterAdminBatchCancelSuspendedOrders(\Box_Event $event): void
    {
        self::runReconcile($event, true);
    }

    public static function onAfterAdminBatchCancelUnpaidOrders(\Box_Event $event): void
    {
        self::runReconcile($event, true);
    }

    /** Safety net in case a hook call failed (network, deploy in progress, …). */
    public static function onAfterAdminCronRun(\Box_Event $event): void
    {
        self::runReconcile($event, false);
    }

    /** Rejects an unavailable subdomain before the plan reaches the cart. */
    public static function onBeforeProductAddedToCart(\Box_Event $event): void
    {
        $params = $event->getParameters();
        if (!is_array($params)) {
            return;
        }
        $event->getDi()['mod_service']('mibidon')->validateCartItem($params);
    }

    private static function dispatchOrderEvent(\Box_Event $event, string $action): void
    {
        $params = $event->getParameters();
        $orderId = (int) (is_array($params) ? ($params['id'] ?? 0) : 0);
        if ($orderId <= 0) {
            return;
        }

        try {
            $service = $event->getDi()['mod_service']('mibidon');
            if ($action === 'create') {
                $service->provisionOrder($orderId);
            } else {
                $service->changeOrderState($orderId, $action);
            }
        } catch (\Throwable $e) {
            // Never break the billing flow; cron reconcile retries.
            error_log('[mibidon] ' . $action . ' order ' . $orderId . ' failed: ' . $e->getMessage());
        }
    }

    private static function runReconcile(\Box_Event $event, bool $force): void
    {
        $di = $event->getDi();
        try {
            if (!$force) {
                $due = false;
                $di['cache']->get('mibidon_reconcile_at', function (ItemInterface $item) use (&$due) {
                    $item->expiresAfter(self::RECONCILE_EVERY_SECONDS);
                    $due = true;

                    return time();
                });
                if (!$due) {
                    return;
                }
            }
            $service = $di['mod_service']('mibidon');
            if ($service->isConfigured()) {
                $service->reconcile();
            }
        } catch (\Throwable $e) {
            error_log('[mibidon] reconcile failed: ' . $e->getMessage());
        }
    }

    /*
     * ---------------------------------------------------------------------
     * Settings
     * ---------------------------------------------------------------------
     */

    /**
     * Module settings (Extensions → MiBidón tiendas), falling back to env vars
     * MIBIDON_PROVISION_URL / MIBIDON_PROVISION_SECRET (php-fpm clear_env must allow them).
     */
    public function getSettings(): array
    {
        $config = $this->di['mod_config']('mibidon');
        $config = is_array($config) ? $config : [];

        $url = trim((string) ($config['endpoint_url'] ?? ''));
        if ($url === '') {
            $url = trim((string) getenv('MIBIDON_PROVISION_URL'));
        }
        $secret = trim((string) ($config['secret'] ?? ''));
        if ($secret === '') {
            $secret = trim((string) getenv('MIBIDON_PROVISION_SECRET'));
        }
        $slugs = array_values(array_filter(array_map('trim', explode(',', (string) ($config['product_slugs'] ?? '')))));

        return [
            'endpoint_url' => $url,
            'secret' => $secret,
            'product_slugs' => $slugs ?: ['plan-mibidon'],
            'company_field' => trim((string) ($config['company_field'] ?? '')) ?: 'empresa',
            'slug_field' => trim((string) ($config['slug_field'] ?? '')) ?: 'subdominio',
            'notify_email' => !isset($config['notify_email']) || (bool) $config['notify_email'],
        ];
    }

    public function isConfigured(): bool
    {
        $s = $this->getSettings();

        return $s['endpoint_url'] !== '' && strlen($s['secret']) >= 32;
    }

    /*
     * ---------------------------------------------------------------------
     * Platform API
     * ---------------------------------------------------------------------
     */

    /**
     * @return array{status:int, body:array}
     */
    public function callPlatform(array $payload): array
    {
        $s = $this->getSettings();
        if (!$this->isConfigured()) {
            throw new \FOSSBilling\InformationException('MiBidón: falta configurar la URL del endpoint o el secreto (mín. 32 caracteres).');
        }

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $timestamp = (string) time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $json, $s['secret']);

        $response = $this->di['http_client']->request('POST', $s['endpoint_url'], [
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'FOSSBilling-Mibidon/1.0',
                'x-mibidon-timestamp' => $timestamp,
                'x-mibidon-signature' => $signature,
            ],
            'body' => $json,
            'timeout' => 20,
        ]);

        $status = $response->getStatusCode();
        try {
            $body = $response->toArray(false);
        } catch (\Throwable) {
            $body = ['ok' => false, 'error' => 'bad_response', 'message' => 'Respuesta no JSON (HTTP ' . $status . ')'];
        }

        return ['status' => $status, 'body' => $body];
    }

    /*
     * ---------------------------------------------------------------------
     * Lifecycle
     * ---------------------------------------------------------------------
     */

    public function provisionOrder(int $orderId): array
    {
        $order = $this->fetchOrder($orderId);
        if ($order === null || !$this->isMibidonProduct((int) $order['product_id'])) {
            return ['skipped' => true];
        }

        $res = $this->callPlatform($this->buildCreatePayload($order));
        $this->handleProvisionResponse($order, $res, 'create');

        return $res;
    }

    public function changeOrderState(int $orderId, string $action): array
    {
        if (!in_array($action, ['suspend', 'unsuspend', 'cancel', 'renew'], true)) {
            throw new \FOSSBilling\Exception('Acción MiBidón inválida');
        }
        $order = $this->fetchOrder($orderId);
        if ($order === null || !$this->isMibidonProduct((int) $order['product_id'])) {
            return ['skipped' => true];
        }

        $res = $this->callPlatform(['action' => $action, 'orderId' => (string) $orderId]);
        $body = $res['body'];
        if (!empty($body['ok']) && isset($body['tenant']) && is_array($body['tenant'])) {
            $this->saveStoreMeta($order, $this->storeFromTenant($body['tenant']) + ['last_error' => null]);
            $this->logInfo($action . ' order ' . $orderId . ' -> ' . ($body['tenant']['slug'] ?? '?'));
        } elseif ($action === 'unsuspend' && ($body['error'] ?? '') === 'not_found') {
            // Reactivated before the store ever existed (e.g. activation hook failed).
            return $this->provisionOrder($orderId);
        } else {
            $message = $this->errorMessage($res);
            $this->saveStoreMeta($order, ['last_error' => $message]);
            $this->logError($action . ' order ' . $orderId . ' failed: ' . $message);
        }

        return $res;
    }

    /**
     * Pushes the billing state of every MiBidón order to the platform (idempotent).
     */
    public function reconcile(): array
    {
        $s = $this->getSettings();
        $placeholders = implode(',', array_fill(0, count($s['product_slugs']), '?'));
        $rows = $this->di['em']->getConnection()->fetchAllAssociative(
            "SELECT co.id, co.client_id, co.product_id, co.status, co.config
             FROM client_order co
             INNER JOIN product p ON p.id = co.product_id
             WHERE p.slug IN ({$placeholders})
             AND co.status IN ('active', 'suspended', 'canceled')
             ORDER BY co.id ASC",
            $s['product_slugs']
        );

        $summary = ['total' => count($rows), 'created' => 0, 'changed' => 0, 'errors' => 0];
        foreach ($rows as $order) {
            try {
                $body = $this->syncOrderRow($order)['body'];
                if (!empty($body['created'])) {
                    ++$summary['created'];
                } elseif (!empty($body['changed'])) {
                    ++$summary['changed'];
                } elseif (empty($body['ok'])) {
                    ++$summary['errors'];
                }
            } catch (\Throwable $e) {
                ++$summary['errors'];
                $this->logError('reconcile order ' . $order['id'] . ': ' . $e->getMessage());
            }
        }
        $this->logInfo(sprintf('reconcile: %d orders, %d created, %d changed, %d errors', $summary['total'], $summary['created'], $summary['changed'], $summary['errors']));

        return $summary;
    }

    /**
     * Creates the store if missing (active orders only) or aligns its state with the order.
     */
    public function syncOrder(int $orderId): array
    {
        $order = $this->fetchOrder($orderId);
        if ($order === null || !$this->isMibidonProduct((int) $order['product_id'])) {
            return ['skipped' => true];
        }
        if (!in_array($order['status'], ['active', 'suspended', 'canceled'], true)) {
            throw new \FOSSBilling\InformationException('La orden está en estado ' . $order['status'] . '; actívala primero');
        }

        return $this->syncOrderRow($order);
    }

    private function syncOrderRow(array $order): array
    {
        $payload = $this->buildCreatePayload($order);
        $payload['action'] = 'sync';
        $payload['status'] = (string) $order['status'];
        $res = $this->callPlatform($payload);
        $body = $res['body'];
        if (!empty($body['created'])) {
            $this->handleProvisionResponse($order, $res, 'sync');
        } elseif (!empty($body['ok'])) {
            if (isset($body['tenant']) && is_array($body['tenant'])) {
                $this->saveStoreMeta($order, $this->storeFromTenant($body['tenant']) + ['last_error' => null]);
            }
        } else {
            $this->saveStoreMeta($order, ['last_error' => $this->errorMessage($res)]);
        }

        return $res;
    }

    /**
     * New one-time password link for the store owner. Only for the order's own client.
     */
    public function requestInvite(int $orderId, int $clientId): string
    {
        $order = $this->fetchOrder($orderId);
        if ($order === null || (int) $order['client_id'] !== $clientId || !$this->isMibidonProduct((int) $order['product_id'])) {
            throw new \FOSSBilling\InformationException('Orden no encontrada');
        }
        if ($order['status'] !== 'active') {
            throw new \FOSSBilling\InformationException('La orden no está activa');
        }

        $res = $this->callPlatform(['action' => 'invite', 'orderId' => (string) $orderId]);
        $body = $res['body'];
        if (empty($body['ok']) || empty($body['inviteUrl'])) {
            throw new \FOSSBilling\InformationException('No pudimos generar el enlace: ' . $this->errorMessage($res));
        }
        $this->logInfo('invite issued for order ' . $orderId);

        return (string) $body['inviteUrl'];
    }

    /** Validates the "subdominio" field when the MiBidón plan is added to the cart. */
    public function validateCartItem(array $params): void
    {
        $productId = (int) ($params['product_id'] ?? 0);
        if ($productId <= 0 || !$this->isMibidonProduct($productId) || !$this->isConfigured()) {
            return;
        }
        $s = $this->getSettings();
        $config = isset($params['config']) && is_array($params['config']) ? $params['config'] : [];
        $slug = trim((string) ($params[$s['slug_field']] ?? $config[$s['slug_field']] ?? ''));
        if ($slug === '') {
            return;
        }

        try {
            $res = $this->callPlatform(['action' => 'check', 'slug' => $slug]);
        } catch (\Throwable $e) {
            // Platform unreachable: don't block the sale; activation reports conflicts.
            $this->logError('slug check failed: ' . $e->getMessage());

            return;
        }
        $body = $res['body'];
        if (!empty($body['ok']) && array_key_exists('available', $body) && !$body['available']) {
            throw new \FOSSBilling\InformationException((string) ($body['message'] ?? 'Ese subdominio no está disponible'));
        }
    }

    /** Store info shown in the client area (no secrets). */
    public function getClientStore(int $orderId, int $clientId): ?array
    {
        $order = $this->fetchOrder($orderId);
        if ($order === null || (int) $order['client_id'] !== $clientId || !$this->isMibidonProduct((int) $order['product_id'])) {
            return null;
        }
        $meta = $this->getStoreMeta($orderId) ?? [];

        return [
            'order_status' => $order['status'],
            'slug' => $meta['slug'] ?? null,
            'url' => $meta['url'] ?? null,
            'admin_url' => $meta['admin_url'] ?? null,
            'billing_status' => $meta['billing_status'] ?? null,
            'pending' => empty($meta['url']),
            'has_error' => !empty($meta['last_error']),
        ];
    }

    public function getStoreMeta(int $orderId): ?array
    {
        $row = $this->di['em']->getConnection()->fetchAssociative(
            'SELECT id, meta_value FROM extension_meta WHERE extension = ? AND rel_type = ? AND rel_id = ? AND meta_key = ?',
            [self::META_EXTENSION, self::META_REL_TYPE, (string) $orderId, self::META_KEY]
        );
        if (!$row) {
            return null;
        }
        $data = json_decode((string) $row['meta_value'], true);

        return is_array($data) ? $data : [];
    }

    /*
     * ---------------------------------------------------------------------
     * Internals
     * ---------------------------------------------------------------------
     */

    private function handleProvisionResponse(array $order, array $res, string $source): void
    {
        $orderId = (int) $order['id'];
        $body = $res['body'];

        if (!empty($body['ok']) && isset($body['tenant']) && is_array($body['tenant'])) {
            $store = $this->storeFromTenant($body['tenant']);
            $this->saveStoreMeta($order, $store + ['last_error' => null, 'provisioned_at' => date('c')]);
            if (!empty($body['created'])) {
                $this->addOrderNote($orderId, 'Tienda MiBidón creada: ' . $store['url']);
            }
            if (!empty($body['inviteUrl'])) {
                $this->notifyClient($order, $store, (string) $body['inviteUrl']);
            }
            $this->logInfo($source . ' order ' . $orderId . ' -> ' . $store['slug'] . (empty($body['created']) ? ' (ya existía)' : ' (creada)'));

            return;
        }

        $message = $this->errorMessage($res);
        $this->saveStoreMeta($order, ['last_error' => $message]);
        $this->addOrderNote($orderId, 'No se pudo crear la tienda MiBidón: ' . $message . '. Corrige el subdominio en la configuración de la orden y usa "Sincronizar" en Extensiones → MiBidón.');
        $this->logError($source . ' order ' . $orderId . ' failed: ' . $message);
    }

    private function storeFromTenant(array $tenant): array
    {
        return [
            'slug' => (string) ($tenant['slug'] ?? ''),
            'url' => (string) ($tenant['url'] ?? ''),
            'admin_url' => (string) ($tenant['adminUrl'] ?? ''),
            'billing_status' => (string) ($tenant['billingStatus'] ?? ''),
        ];
    }

    private function errorMessage(array $res): string
    {
        $body = $res['body'] ?? [];
        $message = $body['message'] ?? $body['error'] ?? null;

        return is_string($message) && $message !== '' ? $message : 'HTTP ' . ($res['status'] ?? '?');
    }

    private function buildCreatePayload(array $order): array
    {
        $s = $this->getSettings();
        $config = json_decode((string) ($order['config'] ?? ''), true);
        $config = is_array($config) ? $config : [];

        $client = $this->di['em']->getConnection()->fetchAssociative(
            'SELECT id, first_name, last_name, email, company, phone_cc, phone FROM client WHERE id = ?',
            [(int) $order['client_id']]
        ) ?: [];

        $ownerName = trim(((string) ($client['first_name'] ?? '')) . ' ' . ((string) ($client['last_name'] ?? '')));
        $company = trim((string) ($config[$s['company_field']] ?? ''));
        if ($company === '') {
            $company = trim((string) ($client['company'] ?? ''));
        }
        if ($company === '') {
            $company = $ownerName;
        }
        $slug = trim((string) ($config[$s['slug_field']] ?? ''));
        if ($slug === '') {
            $slug = $company;
        }
        $phone = trim((string) ($client['phone'] ?? ''));
        $cc = trim((string) ($client['phone_cc'] ?? ''));
        if ($phone !== '' && $cc !== '') {
            $phone = '+' . ltrim($cc, '+') . ' ' . $phone;
        }

        return [
            'action' => 'create',
            'orderId' => (string) $order['id'],
            'clientId' => (string) $order['client_id'],
            'companyName' => $company,
            'slug' => $slug,
            'ownerName' => $ownerName !== '' ? $ownerName : $company,
            'ownerEmail' => (string) ($client['email'] ?? ''),
            'ownerPhone' => $phone !== '' ? $phone : null,
            'plan' => $this->productSlug((int) $order['product_id']),
        ];
    }

    private function fetchOrder(int $orderId): ?array
    {
        $row = $this->di['em']->getConnection()->fetchAssociative(
            'SELECT id, client_id, product_id, status, config FROM client_order WHERE id = ?',
            [$orderId]
        );

        return $row ?: null;
    }

    private function productSlug(int $productId): ?string
    {
        $slug = $this->di['em']->getConnection()->fetchOne('SELECT slug FROM product WHERE id = ?', [$productId]);

        return is_string($slug) ? $slug : null;
    }

    private function isMibidonProduct(int $productId): bool
    {
        $slug = $this->productSlug($productId);

        return $slug !== null && in_array($slug, $this->getSettings()['product_slugs'], true);
    }

    private function saveStoreMeta(array $order, array $data): void
    {
        $conn = $this->di['em']->getConnection();
        $orderId = (int) $order['id'];
        $now = date('Y-m-d H:i:s');
        $current = $this->getStoreMeta($orderId);
        $merged = array_merge($current ?? [], $data, ['updated_at' => date('c')]);
        $value = json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($current === null) {
            $conn->insert('extension_meta', [
                'client_id' => (int) $order['client_id'],
                'extension' => self::META_EXTENSION,
                'rel_type' => self::META_REL_TYPE,
                'rel_id' => (string) $orderId,
                'meta_key' => self::META_KEY,
                'meta_value' => $value,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $conn->update('extension_meta', ['meta_value' => $value, 'updated_at' => $now], [
                'extension' => self::META_EXTENSION,
                'rel_type' => self::META_REL_TYPE,
                'rel_id' => (string) $orderId,
                'meta_key' => self::META_KEY,
            ]);
        }
    }

    private function notifyClient(array $order, array $store, string $inviteUrl): void
    {
        if (!$this->getSettings()['notify_email']) {
            return;
        }
        try {
            $this->di['mod_service']('email')->sendTemplate([
                'code' => 'mod_mibidon_provisioned',
                'to_client' => (int) $order['client_id'],
                'order_id' => (int) $order['id'],
                'store_url' => $store['url'],
                'admin_url' => $store['admin_url'],
                'store_slug' => $store['slug'],
                'invite_url' => $inviteUrl,
            ]);
        } catch (\Throwable $e) {
            $this->logError('email for order ' . $order['id'] . ' not sent: ' . $e->getMessage());
        }
    }

    private function addOrderNote(int $orderId, string $note): void
    {
        try {
            $model = $this->di['db']->getExistingModelById('ClientOrder', $orderId, 'Order not found');
            $this->di['mod_service']('order')->orderStatusAdd($model, $model->status, $note);
        } catch (\Throwable $e) {
            $this->logError('order note ' . $orderId . ': ' . $e->getMessage());
        }
    }

    private function logInfo(string $message): void
    {
        $this->di['logger']->info('[mibidon] ' . str_replace('%', '', $message));
    }

    private function logError(string $message): void
    {
        $this->di['logger']->error('[mibidon] ' . str_replace('%', '', $message));
        error_log('[mibidon] ' . $message);
    }
}
