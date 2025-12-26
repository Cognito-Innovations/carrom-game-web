import { toNano, beginCell } from '@ton/core';
import { NftCollection } from '../wrappers/NftCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    try {
        const nftCollectionCode = await compile('NftCollection');
        const nftItemCode = await compile('nft_item');

        // Config: Set your deployer as owner, empty content/common, 5% royalty to owner
        const deployer = provider.sender().address!;
        const royaltyParams = beginCell()
            .storeUint(500, 16)  // 5% royalty factor
            .storeUint(10000, 16)  // base 100%
            .storeAddress(deployer)
            .endCell();
        const content = beginCell()
            .storeRef(beginCell().storeUint(1, 8).storeStringTail('Carrom NFT Collection').endCell())  // collection_content
            .storeRef(beginCell().storeStringTail('Common metadata').endCell())  // common_content
            .endCell();

        const nftCollection = provider.open(NftCollection.createFromConfig(
            { owner: deployer, content, nftItemCode, royaltyParams },
            nftCollectionCode
        ));

        console.log('Deploying to:', nftCollection.address.toString());

        // Deploy
        await nftCollection.sendDeploy(provider.sender(), toNano('0.1'));  // ~0.1 TON for deploy

        await provider.waitForDeploy(nftCollection.address);

        console.log('Collection deployed at:', nftCollection.address.toString());

        // Test mint one NFT
        await nftCollection.sendMint(provider.sender(), toNano('0.05'), 'https://gateway.pinata.cloud/ipfs/QmExampleMetadataHash');
        console.log('Test mint sent! Check Tonviewer for new item.');
    } catch (error) {
        console.error('Deploy/mint failed:', error);
        process.exit(1);
    }
}