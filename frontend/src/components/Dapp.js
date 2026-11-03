import React from "react";

// We use Ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with Ethers
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational components: the first
// two are UI controls. The third one shows a loading status.
// The fourth one renders a list of errors that appends to a list
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoWalletDetected } from "./NoWalletDetected";

// This is the Hardhat Network id that we set in our hardhat.config.js.
// Here: 31337 is the default hardhat chain id.
const HARDHAT_NETWORK_ID = '31337';

// This is an error code that indicates that the user rejected a request
// An error code of 4001 means the user rejected the request
// See https://eips.ethereum.org/EIP-1193#provider-errors
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// This component is in charge of rendering the whole app.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You can move this variable to a different file if you want.
    this.initialState = {
    tokenData: undefined,
    selectedAddress: undefined,
    balance: undefined,
    txBeingSent: undefined,
    transactionError: undefined,
    networkError: undefined,
    votingStatus: true,
    votesSubmitted: 0,
    userCodename: "",
    isAdmin: false,
    codenamesList: [],
    ranking: []
    };

    this.state = this.initialState;
  }

  render() {
    // Ethereum objects should be injected by a provider like MetaMask
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we check is if a user's address is connected, if it isn't, we
    // show the ConnectWallet component.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p>
              Bem vindo <b>{this.state.selectedAddress}</b>, seu saldo é de{" "}
              <b>
                {ethers.utils.formatUnits(this.state.balance, 18)} {this.state.tokenData.symbol}
              </b>
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* 
              Sending a transaction leads to a bunch of different states.
              The UI has to show them all:
              1. The user's transaction is on the way.
              2. The user's transaction failed, or was rejected by the user.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">

            {/*
              This component takes a function that engages the Transfer component.
              It renders a form to transfer tokens.
            */}
            <Transfer
              transferTokens={(to, amount) =>
                this._transferTokens(to, amount)
              }
              tokenSymbol={this.state.tokenData.symbol}
            />

            <hr />

            {/* Seção Adicionada: Votação e Administração */}
            <div className="mt-4">
              <h4>Votação</h4>
              <p>Status da Votação: <b>{this.state.votingStatus ? "ABERTA" : "FECHADA"}</b></p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.target);
                  const codinome = formData.get("codinome");
                  const amount = formData.get("amount");
                  if (codinome && amount) {
                    this._vote(codinome, amount);
                  }
                }}
              >
                <div className="form-group">
                  <label>Codinome</label>
                  <select className="form-control" name="codinome" required defaultValue="">
                    <option value="" disabled>Escolha um codinome...</option>
                    {this.state.codenamesList.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mt-2">
                  <label>Quantidade de Tokens (máx 2 TRN)</label>
                  <input className="form-control" type="number" step="0.01" name="amount" required />
                </div>
                <div className="form-group mt-3">
                  <input className="btn btn-primary" type="submit" value="Votar" disabled={!this.state.votingStatus} />
                </div>
              </form>
            </div>
            {/* Painel Exclusivo de Administrador */}
            {this.state.isAdmin && (
              <div className="mt-4 p-3 border border-warning rounded">
                <h4 className="text-warning">Painel Administrativo</h4>
                
                <div className="mb-3">
                  <button 
                    className="btn btn-success me-2" 
                    onClick={() => this._votingOn()}
                    disabled={this.state.votingStatus}
                  >
                    Abrir Votação
                  </button>
                  &nbsp;&nbsp;
                  <button 
                    className="btn btn-danger" 
                    onClick={() => this._votingOff()}
                    disabled={!this.state.votingStatus}
                  >
                    Fechar Votação
                  </button>
                </div>

                <hr />

                {/* Formulário de Cadastro de Usuário (updateUser) */}
                <h5>Cadastrar Usuário</h5>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.target);
                    const codinome = formData.get("userCodinome");
                    const address = formData.get("userAddress");
                    if (codinome && address) {
                      this._updateUser(codinome, address);
                    }
                  }}
                  className="mb-4"
                >
                  <div className="form-group">
                    <label>Codinome</label>
                    <input className="form-control" type="text" name="userCodinome" required />
                  </div>
                  <div className="form-group mt-2">
                    <label>Endereço da Carteira</label>
                    <input className="form-control" type="text" name="userAddress" required />
                  </div>
                  <div className="form-group mt-3">
                    <input className="btn btn-warning" type="submit" value="Salvar Usuário" />
                  </div>
                </form>

                <hr />

                {/* Formulário de Emissão de Tokens (issueToken) */}
                <h5>Emitir Tokens</h5>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.target);
                    const codinome = formData.get("issueCodinome");
                    const amount = formData.get("issueAmount");
                    if (codinome && amount) {
                      this._issueToken(codinome, amount);
                    }
                  }}
                >
                <div className="form-group">
                  <label>Selecione o Candidato</label>
                  <select className="form-control" name="issueCodinome" required defaultValue="">
                    <option value="" disabled>Escolha um codinome...</option>
                    {this.state.codenamesList.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                  <div className="form-group mt-2">
                    <label>Quantidade de Tokens (TRN)</label>
                    <input className="form-control" type="number" step="0.01" name="issueAmount" required />
                  </div>
                  <div className="form-group mt-3">
                    <input className="btn btn-warning" type="submit" value="Emitir Tokens" />
                  </div>
                </form>
              </div>
            )}
            {/* Tabela de Ranking */}
            <div className="mt-5 p-4 border rounded shadow-sm bg-white">
              <h3 className="mb-3">Ranking</h3>
              
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col" style={{ width: "80px" }}>#</th>
                      <th scope="col">Codinome</th>
                      <th scope="col">Endereço da Carteira</th>
                      <th scope="col" className="text-end">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.ranking && this.state.ranking.length > 0 ? (
                      this.state.ranking.map((user, index) => (
                        <tr key={user.codinome}>
                          <th scope="row">
                            {index + 1}º
                          </th>
                          <td>
                            <strong>{user.codinome}</strong>
                          </td>
                          <td>
                            <small className="text-muted">{user.address}</small>
                          </td>
                          <td className="text-end">
                            <span>
                              <strong>{user.formattedBalance} TRN</strong>
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          Carregando classificação do contrato...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop it when the
    // component gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It starts the
    // process of connecting MetaMask to the address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We re-initialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress
      // This happens when the user locks their account.
      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize Ethers, fetch the token's data, and start polling for the user's balance.
    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first instantiate the provider, using window.ethereum. Then, we initialize
    // the contract using the provider and the token's artifact.
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // We initialize the contract using the provider and the token's artifact.
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // The next two methods are just used to get the token's data, and
  // to keep the user's balance up to date.

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    const votingStatus = await this._token.voting();
    const userCodename = await this._token.userCodename(this.state.selectedAddress);
    const owner = await this._token.owner();
    const robertaAddr = await this._token.userAddress("roberta");


    const rawRanking = await this._token.getRanking();
    const rawList = Array.from(rawRanking);

    const rankingData = rawList
      .filter((item) => item.codinome && item.codinome.toLowerCase() !== "roberta")
      .map((item) => ({
        codinome: item.codinome,
        address: item.userAddress,
        formattedBalance: parseFloat(ethers.utils.formatUnits(item.balance, 18)),
      }))
      .sort((a, b) => b.formattedBalance - a.formattedBalance);


    const codenamesList = rawList
      .filter((item) => item.codinome && item.codinome.toLowerCase() !== "roberta")
      .map((item) => item.codinome)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    

    const isAdmin = 
      this.state.selectedAddress.toLowerCase() === owner.toLowerCase() ||
      this.state.selectedAddress.toLowerCase() === robertaAddr.toLowerCase();
    
    this.setState({ balance, votingStatus, userCodename, isAdmin, ranking: rankingData, codenamesList});
  }

  // This method sends a transaction, which will transfer tokens
  async _transferTokens(to, amount) {
    try {
      this._dismissTransactionError();

      // Parse amount considering 18 decimals
      const parsedAmount = ethers.utils.parseUnits(amount.toString(), 18);

      const tx = await this._token.transfer(to, parsedAmount);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // Método Adicionado: Realizar Voto
  async _vote(codinome, amount) {
    try {
      this._dismissTransactionError();

      const parsedAmount = ethers.utils.parseUnits(amount.toString(), 18);
      const tx = await this._token.vote(codinome, parsedAmount);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  // Ativar Votação
async _votingOn() {
  try {
    this._dismissTransactionError();
    const tx = await this._token.votingOn();
    this.setState({ txBeingSent: tx.hash });
    await tx.wait();
    await this._updateBalance();
  } catch (error) {
    if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
    this.setState({ transactionError: error });
  } finally {
    this.setState({ txBeingSent: undefined });
  }
}

// Desativar Votação
async _votingOff() {
  try {
    this._dismissTransactionError();
    const tx = await this._token.votingOff();
    this.setState({ txBeingSent: tx.hash });
    await tx.wait();
    await this._updateBalance();
  } catch (error) {
    if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
    this.setState({ transactionError: error });
  } finally {
    this.setState({ txBeingSent: undefined });
  }
}

// Emitir Tokens (issueToken)
async _issueToken(codinome, amount) {
  try {
    this._dismissTransactionError();
    const parsedAmount = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await this._token.issueToken(codinome, parsedAmount);
    this.setState({ txBeingSent: tx.hash });
    await tx.wait();
    await this._updateBalance();
  } catch (error) {
    if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
    this.setState({ transactionError: error });
  } finally {
    this.setState({ txBeingSent: undefined });
  }
}

// Cadastrar/Atualizar Usuário (updateUser)
async _updateUser(codinome, userAddress) {
  try {
    this._dismissTransactionError();
    const tx = await this._token.updateUser(codinome, userAddress);
    this.setState({ txBeingSent: tx.hash });
    
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    await this._updateBalance();
  } catch (error) {
    if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) return;
    console.error(error);
    this.setState({ transactionError: error });
  } finally {
    this.setState({ txBeingSent: undefined });
  }
}

  // This method just clears the error message.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method clears the network error message.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask has connected to the localhost network
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect MetaMask to Localhost:8545'
    });

    return false;
  }
}