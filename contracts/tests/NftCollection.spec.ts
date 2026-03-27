import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { NftCollection } from '../wrappers/NftCollection';
import { toNano, beginCell } from '@ton/core';
import { compile } from '@ton/blueprint';  // For compile in test

describe('NftCollection', () => {
    let blockchain: Blockchain;
    let nftCollection: SandboxContract<NftCollection>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        // Compile (returns Cell directly)
        const nftCollectionCode = await compile('NftCollection');
        const nftItemCode = await compile('nft_item');

        // Config (full, from deploy script)
        const deployerAddr = deployer.address;
        const royaltyParams = beginCell()
            .storeUint(500, 16)
            .storeUint(10000, 16)
            .storeAddress(deployerAddr)
            .endCell();
        const content = beginCell()
            .storeRef(beginCell().storeUint(1, 8).storeStringTail('Carrom NFT Collection').endCell())
            .storeRef(beginCell().storeStringTail('Common metadata').endCell())
            .endCell();

        nftCollection = blockchain.openContract(NftCollection.createFromConfig(
            { owner: deployerAddr, content, nftItemCode, royaltyParams },
            nftCollectionCode
        ));

        // Deploy using wrapper (proxy supplies provider; call with via, value)
        await nftCollection.sendDeploy(deployer.getSender(), toNano('1'));
    });

    it('should mint NFT', async () => {
        // Mint using wrapper (proxy supplies provider; call with via, value, url)
        await nftCollection.sendMint(
            deployer.getSender(),
            toNano('0.05'),
            'https://example-ipfs-metadata.json'
        );

        // Assert: Check next_item_index increased via get_collection_data (proxy supplies provider; no-arg call)
        const data = await nftCollection.getCollectionData();
        expect(data.nextItemIndex).toBe(1n);  // First mint -> index 1
    });
});