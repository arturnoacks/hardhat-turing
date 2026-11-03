//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// We import this library to be able to use console.log
import "hardhat/console.sol";

// Import do padrão ERC-20
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


// Contrato boilerplate adaptado ao padrão ERC20.
contract Turing is ERC20 {
    address public owner;
    address public robertaAddress;

    mapping(string => address) public userAddress;
    mapping(address => string) public userCodename;

    bool public voting;
    mapping(address => mapping(address => bool)) public hasVote;
    mapping(address => uint256) public votesSubmitted;

    string[] public codenamesList;

    modifier isAdmin() {
        require(msg.sender == owner || msg.sender == robertaAddress, "Apenas a Roberta ou o owner podem realizar essa acao");
        _;
    }

    modifier validateRegister(string memory codinome, address user_addr) {
        require(bytes(codinome).length > 0, "A string codinome nao pode ser vazia");
        require(user_addr != address(0), "A string codinome nao pode ser vazia");

        require(userAddress[codinome] == address(0), "Codinome ja cadastrado");
        require(bytes(userCodename[user_addr]).length == 0, "Endereco ja cadastrado");
        _;
    }

    constructor() ERC20("Turing", "TRN") {
        owner = msg.sender;
        robertaAddress = 0x502542668aF09fa7aea52174b9965A7799343Df7;

        voting = true;

        _initUser("roberta", 0x502542668aF09fa7aea52174b9965A7799343Df7);
        _initUser("nome1",   0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _initUser("nome2",   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        _initUser("nome3",   0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        _initUser("nome4",   0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        _initUser("nome5",   0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc);
    }

    function getCodenames() public view returns (string[] memory) {
        return codenamesList;
    }

    function _initUser(string memory codinome, address user_addr) internal validateRegister(codinome, user_addr) {
        if (userAddress[codinome] == address(0)) {
            codenamesList.push(codinome);
        }
        userAddress[codinome] = user_addr;
        userCodename[user_addr] = codinome;
    }

    function updateUser(string memory codinome, address user_addr) public isAdmin validateRegister(codinome, user_addr) {
        if (userAddress[codinome] == address(0)) {
            codenamesList.push(codinome);
        }
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
        require(userAddress[codinome] != address(0), "Usuario invalido");
        require(hasVote[msg.sender][userAddress[codinome]] == false, "Nao eh possivel votar em alguem mais de uma vez");
        require(bytes(codinome).length > 0, "A string codinome nao pode ser vazia");
        require(bytes(userCodename[msg.sender]).length > 0, "Votante nao cadastrado");
        require(qtde_de_Turings > 0 && qtde_de_Turings <= 2 * 10**decimals(), "Quantidade invalida de tokens");

        hasVote[msg.sender][userAddress[codinome]] = true;
        votesSubmitted[msg.sender] += 1;
        _mint(userAddress[codinome], qtde_de_Turings);

        if (votesSubmitted[msg.sender] % 10 == 0) {
            _mint(msg.sender, 1 * 10**decimals());
        }
    }

    struct UserRank {
        string codinome;
        address userAddress;
        uint256 balance;
    }

    function getRanking() public view returns (UserRank[] memory) {
        uint256 length = codenamesList.length;
        UserRank[] memory ranks = new UserRank[](length); // 

        for (uint256 i = 0; i < length; i++) {
            string memory c = codenamesList[i];
            address addr = userAddress[c];
            ranks[i] = UserRank(c, addr, balanceOf(addr));
        }

        return ranks;
    }
}