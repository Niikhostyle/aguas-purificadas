<?php

declare(strict_types=1);

namespace Box\Mod\Mibidon\Api;

use FOSSBilling\Validation\Api\RequiredParams;

/**
 * MiBidón store provisioning (staff).
 */
class Admin extends \FOSSBilling\Api\AbstractApi
{
    /**
     * Calls the platform with a harmless slug check to validate URL + secret.
     */
    public function test_connection($data): array
    {
        $this->checkPermissions('mibidon', 'manage');

        $res = $this->getService()->callPlatform(['action' => 'check', 'slug' => 'prueba-conexion']);
        if ($res['status'] !== 200 || empty($res['body']['ok'])) {
            throw new \FOSSBilling\InformationException('La plataforma respondió HTTP ' . $res['status'] . ': ' . ($res['body']['error'] ?? 'error'));
        }

        return $res['body'];
    }

    /**
     * (Re)provision one order now: creates the store if missing, else syncs its state.
     */
    #[RequiredParams(['order_id' => 'Order ID is required'])]
    public function sync_order($data): array
    {
        $this->checkPermissions('mibidon', 'manage');

        $service = $this->getService();
        $orderId = (int) $data['order_id'];
        $res = $service->syncOrder($orderId);
        if (!empty($res['skipped'])) {
            throw new \FOSSBilling\InformationException('La orden no corresponde a un plan MiBidón');
        }

        return [
            'status' => $res['status'],
            'ok' => !empty($res['body']['ok']),
            'message' => $res['body']['message'] ?? null,
            'store' => $service->getStoreMeta($orderId),
        ];
    }

    /**
     * Pushes the state of all MiBidón orders to the platform.
     */
    public function reconcile($data): array
    {
        $this->checkPermissions('mibidon', 'manage');

        return $this->getService()->reconcile();
    }

    /**
     * Stored store info for an order (slug, URLs, last error).
     */
    #[RequiredParams(['order_id' => 'Order ID is required'])]
    public function store_get($data): ?array
    {
        $this->checkPermissions('mibidon', 'manage');

        return $this->getService()->getStoreMeta((int) $data['order_id']);
    }
}
