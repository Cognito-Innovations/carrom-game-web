import {
    Address,
    beginCell,
    Cell,
    Contract,
    ContractABI,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from '@ton/core';

export type NftCollectionConfig = {
    owner: Address;
    content: Cell;
    nftItemCode: Cell;
    royaltyParams: Cell;
};

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(0, 64)
        .storeRef(config.content)
        .storeRef(config.nftItemCode)
        .storeRef(config.royaltyParams)
        .endCell();
}

export class NftCollection implements Contract {
    abi: ContractABI = { name: 'NftCollection' }

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NftCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint = toNano('0.05')) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMint(provider: ContractProvider, via: Sender, value: bigint, metadataUrl: string, queryId: bigint = 0n) {
        const msg = beginCell()
            .storeUint(1, 32)
            .storeUint(queryId, 64)
            .storeStringTail(metadataUrl)
            .endCell();
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg,
        });
    }

    // Getter for get_collection_data (provider first for sandbox proxy)
    async getCollectionData(provider: ContractProvider) {
        const result = await provider.get('get_collection_data', []);
        const nextItemIndex = result.stack.readBigNumber();
        const content = result.stack.readCell();
        const ownerAddress = result.stack.readAddress();
        return { nextItemIndex, content, ownerAddress };
    }
}