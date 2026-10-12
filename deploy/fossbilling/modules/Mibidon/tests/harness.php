<?php

/**
 * Dev-only harness: runs Box\Mod\Mibidon\Service with stubbed FOSSBilling services
 * (SQLite instead of MariaDB, curl instead of Symfony HttpClient) against a running
 * MiBidón `next dev`. See INSTALL-MIBIDON-MODULE.md → "Prueba local del módulo".
 *
 *   docker run --rm -v "$PWD/deploy/fossbilling/modules/Mibidon:/m" \
 *     -e MIBIDON_TEST_URL=http://host.docker.internal:43125/api/platform/provision \
 *     -e MIBIDON_TEST_HOST=localhost:43125 -e MIBIDON_PROVISION_SECRET=... \
 *     php:8.3-cli php /m/tests/harness.php
 */

declare(strict_types=1);

namespace Pimple {
    class Container implements \ArrayAccess
    {
        private array $v = [];

        public function offsetExists(mixed $k): bool
        {
            return isset($this->v[$k]);
        }

        public function offsetGet(mixed $k): mixed
        {
            return $this->v[$k];
        }

        public function offsetSet(mixed $k, mixed $val): void
        {
            $this->v[$k] = $val;
        }

        public function offsetUnset(mixed $k): void
        {
            unset($this->v[$k]);
        }
    }
}

namespace FOSSBilling {
    interface InjectionAwareInterface
    {
        public function setDi(\Pimple\Container $di): void;

        public function getDi(): ?\Pimple\Container;
    }

    class Exception extends \Exception
    {
        public function __construct(string $message = '', ?array $vars = null, int $code = 0)
        {
            parent::__construct($vars ? strtr($message, $vars) : $message, $code);
        }
    }

    class InformationException extends Exception
    {
    }
}

namespace FOSSBilling\Interfaces {
    interface WidgetProviderInterface
    {
        public function getWidgets(): array;
    }
}

namespace Symfony\Contracts\Cache {
    interface ItemInterface
    {
        public function expiresAfter(int|\DateInterval|null $time): static;
    }
}

namespace {
    function __trans(string $s): string
    {
        return $s;
    }

    class Box_Event
    {
        public function __construct(private \Pimple\Container $di, private array $params)
        {
        }

        public function getParameters(): array
        {
            return $this->params;
        }

        public function getDi(): \Pimple\Container
        {
            return $this->di;
        }
    }

    /** Subset of Doctrine DBAL Connection used by the module. */
    class FakeConnection
    {
        public function __construct(public PDO $pdo)
        {
        }

        private function run(string $sql, array $params): PDOStatement
        {
            $st = $this->pdo->prepare($sql);
            $st->execute(array_values($params));

            return $st;
        }

        public function fetchAssociative(string $sql, array $params = []): array|false
        {
            return $this->run($sql, $params)->fetch(PDO::FETCH_ASSOC);
        }

        public function fetchAllAssociative(string $sql, array $params = []): array
        {
            return $this->run($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
        }

        public function fetchOne(string $sql, array $params = []): mixed
        {
            return $this->run($sql, $params)->fetchColumn();
        }

        public function insert(string $table, array $data): int
        {
            $cols = implode(',', array_keys($data));
            $qs = implode(',', array_fill(0, count($data), '?'));
            $this->run("INSERT INTO {$table} ({$cols}) VALUES ({$qs})", $data);

            return 1;
        }

        public function update(string $table, array $data, array $where): int
        {
            $set = implode(',', array_map(fn ($c) => "{$c} = ?", array_keys($data)));
            $w = implode(' AND ', array_map(fn ($c) => "{$c} = ?", array_keys($where)));

            return $this->run("UPDATE {$table} SET {$set} WHERE {$w}", [...array_values($data), ...array_values($where)])->rowCount();
        }
    }

    class FakeResponse
    {
        public function __construct(private int $status, private string $body)
        {
        }

        public function getStatusCode(): int
        {
            return $this->status;
        }

        public function toArray(bool $throw = true): array
        {
            $d = json_decode($this->body, true);
            if (!is_array($d)) {
                throw new RuntimeException('not json');
            }

            return $d;
        }
    }

    /** Stand-in for Symfony HttpClient; forces the Host header like a same-VPS call to 127.0.0.1. */
    class FakeHttpClient
    {
        public function request(string $method, string $url, array $opts): FakeResponse
        {
            $headers = ['Host: ' . getenv('MIBIDON_TEST_HOST')];
            foreach ($opts['headers'] as $k => $v) {
                $headers[] = "{$k}: {$v}";
            }
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_POSTFIELDS => $opts['body'],
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => (int) $opts['timeout'],
            ]);
            $body = (string) curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

            return new FakeResponse($status, $body);
        }
    }

    require __DIR__ . '/../Service.php';

    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE product (id INTEGER PRIMARY KEY, slug TEXT, title TEXT)');
    $pdo->exec('CREATE TABLE client (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, email TEXT, company TEXT, phone_cc TEXT, phone TEXT)');
    $pdo->exec('CREATE TABLE client_order (id INTEGER PRIMARY KEY, client_id INTEGER, product_id INTEGER, status TEXT, config TEXT)');
    $pdo->exec('CREATE TABLE extension_meta (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, extension TEXT, rel_type TEXT, rel_id TEXT, meta_key TEXT, meta_value TEXT, created_at TEXT, updated_at TEXT)');

    $run = bin2hex(random_bytes(3));
    $base = random_int(100000, 900000);
    $pdo->exec("INSERT INTO product VALUES (2, 'plan-mibidon', 'Plan'), (1, 'domain-checker', 'Dominios')");
    $pdo->exec("INSERT INTO client VALUES (1, 'Ana', 'Pérez', 'ana-{$run}@example.com', 'Aguas Ana {$run}', '56', '912345678')");
    $cfg = json_encode(['period' => '1M', 'empresa' => "Aguas PHP {$run}", 'subdominio' => "PHP {$run}"]);
    $st = $pdo->prepare('INSERT INTO client_order VALUES (?, 1, 2, ?, ?)');
    $st->execute([$base + 1, 'active', $cfg]);
    $st->execute([$base + 2, 'active', $cfg]);
    $st->execute([$base + 3, 'active', json_encode(['period' => '1M'])]);
    $pdo->exec('INSERT INTO client_order VALUES (' . ($base + 4) . ", 1, 1, 'active', '{}')");

    $orderService = new class {
        public array $notes = [];

        public function orderStatusAdd($order, $status, $note): bool
        {
            $this->notes[] = "#{$order->id} {$note}";

            return true;
        }
    };
    $emailService = new class {
        public array $emails = [];

        public function sendTemplate(array $data): bool
        {
            $this->emails[] = $data;

            return true;
        }
    };

    $di = new \Pimple\Container();
    $service = new \Box\Mod\Mibidon\Service();
    $di['mod_config'] = fn ($name) => [
        'endpoint_url' => getenv('MIBIDON_TEST_URL'),
        'secret' => getenv('MIBIDON_PROVISION_SECRET'),
        'product_slugs' => 'plan-mibidon',
    ];
    $di['http_client'] = new FakeHttpClient();
    $di['em'] = new class(new FakeConnection($pdo)) {
        public function __construct(private FakeConnection $c)
        {
        }

        public function getConnection(): FakeConnection
        {
            return $this->c;
        }
    };
    $di['db'] = new class($pdo) {
        public function __construct(private PDO $pdo)
        {
        }

        public function getExistingModelById(string $type, int $id, string $msg): object
        {
            $st = $this->pdo->prepare('SELECT id, status FROM client_order WHERE id = ?');
            $st->execute([$id]);

            return (object) $st->fetch(PDO::FETCH_ASSOC);
        }
    };
    $di['logger'] = new class {
        public function info(string $m): void
        {
            echo "    log: {$m}\n";
        }

        public function error(string $m): void
        {
            echo "    log ERROR: {$m}\n";
        }
    };
    $di['mod_service'] = fn (string $name) => match (strtolower($name)) {
        'order' => $orderService,
        'email' => $emailService,
        'mibidon' => $service,
    };
    $service->setDi($di);

    $fail = 0;
    $check = function (string $name, bool $ok, mixed $detail = null) use (&$fail): void {
        echo ($ok ? '  ok   ' : '  FAIL ') . $name . ($ok || $detail === null ? '' : ' ' . json_encode($detail)) . "\n";
        $fail += $ok ? 0 : 1;
    };
    $setStatus = function (int $id, string $status) use ($pdo): void {
        $pdo->prepare('UPDATE client_order SET status = ? WHERE id = ?')->execute([$status, $id]);
    };
    $o1 = $base + 1;

    echo "cart validation\n";
    try {
        $service->validateCartItem(['product_id' => 2, 'subdominio' => 'demo']);
        $check('taken subdomain blocks cart', false);
    } catch (\FOSSBilling\InformationException $e) {
        $check('taken subdomain blocks cart: ' . $e->getMessage(), true);
    }
    $service->validateCartItem(['product_id' => 2, 'subdominio' => "libre {$run}"]);
    $check('free subdomain passes cart', true);
    $service->validateCartItem(['product_id' => 1, 'subdominio' => 'demo']);
    $check('other products ignored', true);

    echo "activate hook\n";
    \Box\Mod\Mibidon\Service::onAfterAdminOrderActivate(new Box_Event($di, ['id' => $o1]));
    $meta = $service->getStoreMeta($o1);
    $check('store meta saved', ($meta['slug'] ?? '') === "php-{$run}" && str_contains((string) ($meta['url'] ?? ''), "php-{$run}."), $meta);
    $check('activation email queued with invite', count($emailService->emails) === 1 && str_contains($emailService->emails[0]['invite_url'], '/admin/activar?token='), $emailService->emails);
    $check('order note added', str_contains(implode("\n", $orderService->notes), 'Tienda MiBidón creada'), $orderService->notes);
    $check('no invite stored in meta', !str_contains((string) json_encode($meta), 'token'), $meta);

    \Box\Mod\Mibidon\Service::onAfterAdminOrderActivate(new Box_Event($di, ['id' => $base + 2]));
    $meta2 = $service->getStoreMeta($base + 2);
    $check('slug conflict recorded as last_error', str_contains((string) ($meta2['last_error'] ?? ''), 'ya está en uso'), $meta2);

    \Box\Mod\Mibidon\Service::onAfterAdminOrderActivate(new Box_Event($di, ['id' => $base + 4]));
    $check('non-MiBidón order ignored', $service->getStoreMeta($base + 4) === null);

    echo "client area\n";
    $store = $service->getClientStore($o1, 1);
    $check('client sees store', ($store['url'] ?? null) !== null && $store['pending'] === false, $store);
    $check('other client cannot see store', $service->getClientStore($o1, 999) === null);
    $url = $service->requestInvite($o1, 1);
    $check('invite link for owner', str_contains($url, '/admin/activar?token='), $url);

    echo "suspend / unsuspend / cancel\n";
    $setStatus($o1, 'suspended');
    \Box\Mod\Mibidon\Service::onAfterAdminOrderSuspend(new Box_Event($di, ['id' => $o1]));
    $check('suspended', ($service->getStoreMeta($o1)['billing_status'] ?? '') === 'suspended');
    try {
        $service->requestInvite($o1, 1);
        $check('no invite while suspended', false);
    } catch (\FOSSBilling\InformationException) {
        $check('no invite while suspended', true);
    }
    $setStatus($o1, 'active');
    \Box\Mod\Mibidon\Service::onAfterAdminOrderUnsuspend(new Box_Event($di, ['id' => $o1]));
    $check('unsuspended', ($service->getStoreMeta($o1)['billing_status'] ?? '') === 'active');
    \Box\Mod\Mibidon\Service::onAfterAdminOrderRenew(new Box_Event($di, ['id' => $o1]));
    $check('renew keeps active', ($service->getStoreMeta($o1)['billing_status'] ?? '') === 'active');

    echo "reconcile\n";
    $setStatus($o1, 'suspended');
    $sum = $service->reconcile();
    $check('reconcile suspends drifted order', ($service->getStoreMeta($o1)['billing_status'] ?? '') === 'suspended' && $sum['changed'] >= 1, $sum);
    $sum2 = $service->reconcile();
    $check('reconcile idempotent', $sum2['changed'] === 0 && $sum2['created'] === 0, $sum2);
    $check('order 3 (no form fields) created from client company', ($service->getStoreMeta($base + 3)['slug'] ?? '') !== '', $service->getStoreMeta($base + 3));

    $setStatus($o1, 'canceled');
    \Box\Mod\Mibidon\Service::onAfterAdminOrderCancel(new Box_Event($di, ['id' => $o1]));
    $check('canceled', ($service->getStoreMeta($o1)['billing_status'] ?? '') === 'canceled');
    $setStatus($base + 3, 'canceled');
    \Box\Mod\Mibidon\Service::onBeforeAdminOrderDelete(new Box_Event($di, ['id' => $base + 3]));
    $check('delete cancels store', ($service->getStoreMeta($base + 3)['billing_status'] ?? '') === 'canceled');

    echo $fail ? "\n{$fail} check(s) FAILED\n" : "\nall PHP checks passed\n";
    exit($fail ? 1 : 0);
}
