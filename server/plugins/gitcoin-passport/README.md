## About Gitcoin Passport

Gitcoin Passport is a digital identity verification system designed to enhance the security and integrity of web3 platforms. It aims to provide a reliable way to verify the identity of users, reducing fraud and ensuring that individuals are unique and legitimate participants within the ecosystem.

## Key Features and Benefits

1. **Proof of Humanity**: Gitcoin Passport helps verify that users are real humans and not bots, which is crucial for various decentralized applications (dApps) and platforms.

2. **Reputation System**: It can be used to build a reputation score based on a user's activity and contributions within the web3 ecosystem. This reputation can help users gain trust and access to various opportunities.

3. **Privacy-Preserving**: While verifying identity, Gitcoin Passport aims to preserve user privacy. It uses various techniques to ensure that personal data is not exposed unnecessarily.

4. **Integration with dApps**: Gitcoin Passport can be integrated into various decentralized applications to provide a seamless user verification process, enhancing the security and reliability of the platform.

5. **Incentive Alignment**: By ensuring that only verified users participate, Gitcoin Passport helps align incentives and ensure fair distribution of rewards and resources in the web3 ecosystem.

Overall, Gitcoin Passport is an important tool in the web3 space, helping to build a more secure, trustworthy, and efficient decentralized environment.

## Using the plugin

The Gitcoin Passport plugin for OrbisDB can be used to benefit from those features effortlessly, simply by assigning the plugin to the context you want and selecting the right settings.

### Settings

When installing the plugin youn will have to submit your `Gitcoin Passport API key` and you `Scorer ID` which can be obtained [here]("https://www.scorer.gitcoin.co/").

Once the plugin is installed you will be able to assign it to the context of your choice or use it globally on your OrbisDB instance. To do this you have to enter `Score required` in order to be able to write streams to the context selected. The plugin will then automatically detect if the user has the score required and approve or reject streams based on this.

### API Route

The Gitcoin Passport plugin also exposes an API route that you can use to test from your front-end if the user connected has the required score or not, it's available at the `verify` endpoint and will return a result like this:

```
{
   "has_access": true,
   "address: "0x...",
   "score": 55
}
```
