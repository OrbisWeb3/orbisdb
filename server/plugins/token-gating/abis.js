export const erc20_abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    /** Will check if contract is an ERC721 or ERC1155  */
    'function supportsInterface(bytes4 interfaceId) view returns (bool)',

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

export const erc721_abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    /** Will check if contract is an ERC721 or ERC1155  */
    'function supportsInterface(bytes4 interfaceId) view returns (bool)',

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

export const erc1155_abi = [
    // Read-Only Functions
    "function balanceOf(address owner, uint256 id) view returns (uint256)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];