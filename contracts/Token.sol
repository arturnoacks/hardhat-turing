//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.9;

// We import this library to be able to use console.log
import "hardhat/console.sol";


// This is the main building block for smart contracts.
contract Token {
    // Some string type variables to identify the token.
    string public name = "My Hardhat Token";
    string public symbol = "MHT";

    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public totalSupply = 1000000;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account balance.
    mapping(address => uint256) balances;

    mapping(string => address) public users;

    bool voting = true;

    // The Transfer event helps off-chain aplications understand
    // what happens within your contract.
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    modifier isAdmin() {
        require(msg.sender == owner || msg.sender == users["roberta"], "Apenas Roberta ou o owner podem realizar essa acao");
        _;
    }

    /**
     * Contract initialization.
     */
    constructor() {
        // The totalSupply is assigned to the transaction sender, which is the
        // account that is deploying the contract.
        balances[msg.sender] = totalSupply;
        owner = msg.sender;

        users["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        users["nome1"]   = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        users["nome2"]   = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        users["nome3"]   = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        users["nome4"]   = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
        users["nome5"]   = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

    }

    function updateUser(string calldata codinome, address user_addr) isAdmin() public {
        require(bytes(codinome).length > 0, "A string codinome nao pode ser vazia");
        users[codinome] = user_addr;
    }

    function votingOn() isAdmin() public {voting = true;}

    function votingOff() isAdmin() public {voting = false;}

    function issueToken(string calldata codinome , int qtde_de_Turings) isAdmin() public {

    }

    /**
     * A function to transfer tokens.
     *
     * The `external` modifier makes a function *only* callable from outside
     * the contract.
     */
    function transfer(address to, uint256 amount) external {
        // Check if the transaction sender has enough tokens.
        // If `require`'s first argument evaluates to `false` then the
        // transaction will revert.
        require(balances[msg.sender] >= amount, "Not enough tokens");

        // We can print messages and values using console.log, a feature of
        // Hardhat Network:
        console.log(
            "Transferring from %s to %s %s tokens",
            msg.sender,
            to,
            amount
        );

        // Transfer the amount.
        balances[msg.sender] -= amount;
        balances[to] += amount;

        // Notify off-chain applications of the transfer.
        emit Transfer(msg.sender, to, amount);
    }

    /**
     * Read only function to retrieve the token balance of a given account.
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
