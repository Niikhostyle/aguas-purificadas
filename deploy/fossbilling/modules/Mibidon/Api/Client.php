<?php

declare(strict_types=1);

namespace Box\Mod\Mibidon\Api;

use FOSSBilling\Validation\Api\RequiredParams;

/**
 * MiBidón store info for the logged-in client.
 */
class Client extends \FOSSBilling\Api\AbstractApi
{
    /**
     * Store URLs for one of the client's orders, or null if it isn't a MiBidón plan.
     */
    #[RequiredParams(['order_id' => 'Order ID is required'])]
    public function store($data): ?array
    {
        $identity = $this->getIdentity();

        return $this->getService()->getClientStore((int) $data['order_id'], (int) $identity->id);
    }

    /**
     * One-time link to create / reset the store admin password.
     *
     * @return string activation URL on <slug>.mibidon.cl
     */
    #[RequiredParams(['order_id' => 'Order ID is required'])]
    public function invite($data): string
    {
        $identity = $this->getIdentity();

        return $this->getService()->requestInvite((int) $data['order_id'], (int) $identity->id);
    }
}
