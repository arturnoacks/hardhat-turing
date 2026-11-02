//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.9;

// We import this library to be able to use console.log
import "hardhat/console.sol";

// Import do padrão ERC-20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


// Contrato boilerplate adaptado ao padrão ERC20.
contract Turing is ERC20 {
    address public owner;

    mapping(string => address) public userAddress;
    mapping(address => string) public userCodename;

    bool public voting = true;
    mapping(address => mapping(string => bool)) public hasVote;
    mapping(address => uint256) public votesSubmitted;

    modifier isAdmin() {
        require(msg.sender == owner || msg.sender == userAddress["roberta"], "Apenas a Roberta ou o owner podem realizar essa acao");
        _;
    }

    constructor() ERC20("Turing", "TRN") {
        owner = msg.sender;

        userAddress["roberta"] = 0x502542668aF09fa7aea52174b9965A7799343Df7;
        userAddress["nome1"]   = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        userAddress["nome2"]   = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
        userAddress["nome3"]   = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
        userAddress["nome4"]   = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;
        userAddress["nome5"]   = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc;

        userCodename[userAddress["roberta"]] = "roberta";
        userCodename[userAddress["nome1"]]   = "nome1";
        userCodename[userAddress["nome2"]]   = "nome2";
        userCodename[userAddress["nome3"]]   = "nome3";
        userCodename[userAddress["nome4"]]   = "nome4";
        userCodename[userAddress["nome5"]]   = "nome5";
    }

    function updateUser(string calldata codinome, address user_addr) public isAdmin {
        require(bytes(codinome).length > 0, "A string codinome nao pode ser vazia");
        userAddress[codinome] = user_addr;
        userCodename[user_addr] = codinome;
    }

    function votingOn() public isAdmin { voting = true; }
    function votingOff() public isAdmin { voting = false; }

    function issueToken(string calldata codinome, uint256 qtde_de_Turings) public isAdmin {
        require(userAddress[codinome] != address(0), "Usuario invalido");
        _mint(userAddress[codinome], qtde_de_Turings);
    }

    function vote(string calldata codinome, uint256 qtde_de_Turings) public {
        require(voting == true, "A votacao esta fechada");
        require(userAddress[codinome] != msg.sender, "Nao eh possivel votar em si mesmo");
        require(hasVote[msg.sender][codinome] == false, "Nao eh possivel votar em alguem mais de uma vez");
        require(bytes(codinome).length > 0, "A string codinome nao pode ser vazia");
        require(bytes(userCodename[msg.sender]).length > 0, "Votante nao cadastrado");

        hasVote[msg.sender][codinome] = true;
        votesSubmitted[msg.sender] += 1;
        _mint(userAddress[codinome], qtde_de_Turings);

        if (votesSubmitted[msg.sender] % 10 == 0) {
            _mint(msg.sender, 1);
        }
    }
}