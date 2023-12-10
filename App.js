import React, { Component} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Picker } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import localforage from 'localforage';
import { TextInput } from 'react-native-web';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valor: null,
      saldoConfirmado: false,
      modalVisible: false,
      modalConfigVisible: false,
      modalDelete: false,
      tipoTransacao: 'debito',
      tituloTransacao: '',
      valorTransacao: null,
      transacoes: [],
      total: null,
      sobra: null,
      transacaoDelete: null,
    };
  }
  formatarValor = (valor) => {
    const opcoesFormatacao = {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false, 
    };
    return (valor/100).toLocaleString('pt-BR', opcoesFormatacao);
  };
  async componentDidMount() {
    // await localforage.clear();
    const valor = await localforage.getItem('saldoInicial');
    const confirmed = await localforage.getItem('saldoConfirmado');
    const listaTransacoes = await localforage.getItem('listaTransacoes');
    const sobra = await localforage.getItem('saldoSobra');
    const totalDivida =  await localforage.getItem('saldoDivida');

    this.setState({ 
      saldoConfirmado: confirmed,
      valor: valor,
      transacoes: listaTransacoes,
      sobra: sobra,
      total: totalDivida,
    });
  }
  handleConfirmarInicial = async () => {
    const valor = this.state.valor
    const divida = this.formatarValor(0)
    this.setState({ 
      saldoConfirmado: true,
      sobra: valor,
      transacoes: [],
      total: divida,
    });
    await localforage.setItem('saldoSobra', valor);
    await localforage.setItem('saldoInicial', valor);
    await localforage.setItem('saldoConfirmado',true);
    await localforage.setItem('listaTransacoes',[]);    
    await localforage.setItem('saldoDivida',divida);    
  };
  exibirModal = () => {
    this.setState({ modalVisible: true });
  };
  exibirModalConfig = () => {    
    this.setState({ modalConfigVisible: true });
  }
  exibirModalconfirmarDelete = (transacao) => {
    this.setState({ modalDelete: true, transacaoDelete: transacao});
  }
  fecharModal = () => {
    this.setState({
      modalVisible: false,
      tipoTransacao: 'debito',
      tituloTransacao: '',
      valorTransacao: '',
    });
  };
  fecharModalConfig = () => {
    this.setState({
      modalConfigVisible: false,
      valor: this.state.valor
    });
  };
  fecharModalDelete = () => {
    this.setState({
      modalDelete: false,
    });
  }
  handleConfirmAdd = async () => {
    const lista = await localforage.getItem('listaTransacoes');
    const newId = lista.length > 0 ? lista[lista.length - 1].id +1 : 0
    
    const { tipoTransacao, tituloTransacao, valorTransacao, transacoes } = this.state;
    
    const saldoInicial =  await localforage.getItem('saldoInicial');
    const inicialLimpo = parseFloat(saldoInicial.replace(/[^\d]/g, '')); 
    const totalDivida =  await localforage.getItem('saldoDivida');
    const dividaLimpo = parseFloat(totalDivida.replace(/[^\d]/g, ''));
    const valorTransacaoLimpo = parseFloat(valorTransacao.replace(/[^\d]/g, ''));
    if(tipoTransacao === 'debito') {
      // diminui do saldo e atualiza o total da divida e a sobra
      const novoTotalDivida = dividaLimpo + valorTransacaoLimpo
      const novaSobra = novoTotalDivida > inicialLimpo ? 0 :  inicialLimpo - novoTotalDivida
      
      const novoTotalDividaFormatted = this.formatarValor(novoTotalDivida)
      const novaSobraFormatted = this.formatarValor(novaSobra)
      await localforage.setItem('saldoDivida', novoTotalDividaFormatted);
      await localforage.setItem('saldoSobra', novaSobraFormatted);    
      this.setState({total: novoTotalDividaFormatted, sobra: novaSobraFormatted});
    } else {
      // se for crédito soma no saldo inicial e atualiza sobra
      const novoSaldoInicial = inicialLimpo + valorTransacaoLimpo
      const novaSobra = novoSaldoInicial - dividaLimpo
      const novoInicialFormatted = this.formatarValor(novoSaldoInicial)
      const novaSobraFormatted = this.formatarValor(novaSobra)
      await localforage.setItem('saldoInicial', novoInicialFormatted);
      await localforage.setItem('saldoSobra', novaSobraFormatted);  
      this.setState({valor: novoInicialFormatted, sobra: novaSobraFormatted});
    }    
    const novaTransacao = { id: newId, tipo: tipoTransacao, titulo: tituloTransacao, valor: valorTransacao };
    const novaListaTransacoes = [...transacoes, novaTransacao];    
    await localforage.setItem('listaTransacoes', novaListaTransacoes);
    this.setState({ transacoes: novaListaTransacoes });
    this.fecharModal();
  };
  handleConfirmDelete = async () => {
    const transacao = this.state.transacaoDelete
    const saldoInicial =  await localforage.getItem('saldoInicial');
    const inicialLimpo = parseFloat(saldoInicial.replace(/[^\d]/g, '')); 
    const totalDivida =  await localforage.getItem('saldoDivida');
    const dividaLimpo = parseFloat(totalDivida.replace(/[^\d]/g, ''));
    const valorTransacaoLimpo = parseFloat(transacao.valor.replace(/[^\d]/g, ''));

    if(transacao.tipo === 'debito') {
      //se for debito
      const novoTotalDivida = dividaLimpo - valorTransacaoLimpo
      const novaSobra = novoTotalDivida > inicialLimpo ? 0 :  inicialLimpo - novoTotalDivida

      const novoTotalDividaFormatted = this.formatarValor(novoTotalDivida)
      const novaSobraFormatted = this.formatarValor(novaSobra)
      await localforage.setItem('saldoDivida', novoTotalDividaFormatted);
      await localforage.setItem('saldoSobra', novaSobraFormatted);    
      this.setState({total: novoTotalDividaFormatted, sobra: novaSobraFormatted});
    } else {
      // se for crédito
      const novoSaldoInicial = inicialLimpo - valorTransacaoLimpo
      const novaSobra = dividaLimpo > novoSaldoInicial ? 0 : novoSaldoInicial - dividaLimpo

      const novoSaldoInicialFormatted = this.formatarValor(novoSaldoInicial)
      const novaSobraFormatted = this.formatarValor(novaSobra)
      await localforage.setItem('saldoSobra', novaSobraFormatted);   
      await localforage.setItem('saldoInicial', novoSaldoInicialFormatted);
      this.setState({sobra: novaSobraFormatted, valor: novoSaldoInicialFormatted});
    }
    const lista = await localforage.getItem('listaTransacoes');
    const novaLista = lista.filter(item => item.id !== transacao.id);
    await localforage.setItem('listaTransacoes', novaLista);
    this.setState({ transacoes: novaLista });
    this.fecharModalDelete()
  };
  handleConfirmarConfig = async () => {
    const saldoNovo = this.state.valor
    const resetValues = this.formatarValor(0)
    await localforage.setItem('saldoSobra', saldoNovo);
    await localforage.setItem('saldoInicial', saldoNovo);
    await localforage.setItem('saldoDivida', resetValues);
    await localforage.setItem('listaTransacoes', []);
    this.setState({ 
      sobra: saldoNovo,
      total: resetValues,
      transacoes: []
    });
    this.fecharModalConfig();
  }
  renderContent() {
    if (this.state.saldoConfirmado) {
      // Renderize o novo conteúdo após o saldo ser confirmado
      return (
        <View style={styles.content}>
          <Text style={styles.saldoDisponivel}>Saldo disponível:</Text>
          <Text style={styles.valorDisponivel}>{this.state.valor}</Text>
          <View style={styles.antesDaLista}>
            <Text style={styles.lancamentos}>Lançamentos:</Text>
            <TouchableOpacity onPress={this.exibirModal}>
              <Image style={styles.botaoCheckIcone} source={require('./assets/add.png')} />
            </TouchableOpacity>
          </View>
          {/* renderiza a lista se não estiver vazia */}
          {this.state.transacoes.length > 0 && (
              <View style={styles.lista}>
                {this.state.transacoes.map((transacao, index) => (   
                  <View style={styles[transacao.tipo]} key={index}>
                    <View>
                      <Text style={styles.tituloItemLista}>{transacao.titulo}</Text>
                      <Text>{transacao.valor}</Text>
                    </View>
                    <TouchableOpacity onPress={() => this.exibirModalconfirmarDelete(transacao)}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/delete.png')} />
                    </TouchableOpacity>
                  </View>           
                ))}
              </View>
           )} 
          {this.state.transacoes.length === 0 && (
              <View style={styles.lista}>
                <Text>Não há transações cadastradas</Text>
              </View>
           )} 
           {/* rodapé após a lista */}
          <View style={styles.rodapeLista}>
            <View style={styles.rodapeItem}>
              <Text style={styles.greenSquare} />
              <Text>Crédito</Text>
            </View>
            <View style={styles.rodapeItem}>
              <Text style={styles.redSquare}/>
              <Text>Débito</Text>
            </View>
          </View>
          <View style={styles.itemValue}>
            <Text style={styles.label}>Total:</Text>
            <Text>{this.state.total}</Text>
          </View>
          <View style={styles.itemValue}>
            <Text style={styles.label}>Sobra:</Text>
            <Text>{this.state.sobra}</Text>
          </View>
           {/* mostra modal de confirmas delete */}
           {this.state.modalDelete && (
              <Modal transparent={true}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalInner}>
                    <Text style={styles.tituloModalConfirm}>Tem certeza que deseja remover esta transação?</Text>
                    <View style={styles.buttonsModal}>
                      <TouchableOpacity onPress={this.fecharModalDelete}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/cancel.png')} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={this.handleConfirmDelete}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/confirm.png')} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
           )}
          {/* Mostra modal de adicionar Débito/Crédito*/}
          {this.state.modalVisible && (
            <Modal transparent={true}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalInner}>
                    <Text style={styles.lancamentos}>Adicionar novo lançamento:</Text>
                    <Text style={styles.label}>Tipo:</Text>
                    <Picker
                      style={styles.input}
                      selectedValue={this.state.tipoTransacao}
                      onValueChange={(itemValue, itemIndex) =>
                        this.setState({ tipoTransacao: itemValue })
                      }
                    >
                      <Picker.Item label="Débito" value="debito" />
                      <Picker.Item label="Crédito" value="credito" />
                    </Picker>
                    <Text style={styles.label}>Título:</Text>
                    <TextInput
                      style={styles.input}
                      value={this.state.tituloTransacao}
                      onChangeText={(text) => this.setState({ tituloTransacao: text })}
                    />
                    <Text style={styles.label}>Valor:</Text>
                    <TextInputMask
                      style={styles.input}
                      type={'money'}
                      placeholder="R$"
                      keyboardType="numeric"
                      value={this.state.valorTransacao}
                      onChangeText={(text) => this.setState({ valorTransacao: text })}
                    />
                    <View style={styles.buttonsModal}>
                      <TouchableOpacity onPress={this.fecharModal}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/cancel.png')} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={this.handleConfirmAdd}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/confirm.png')} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
            </Modal>
          )}
          {/* Modal de configuração do saldo disponível */}
          {this.state.modalConfigVisible && (
            <Modal transparent={true}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalInner}>
                    <Text style={styles.lancamentos}>Saldo Disponível:</Text>
                    <TextInputMask
                      style={styles.input}
                      type={'money'}
                      placeholder="R$"
                      keyboardType="numeric"
                      value={this.state.valor}
                      onChangeText={(text) => this.setState({ valor: text })}
                    />
                    <Text style={styles.caption}>Ao atualizar o saldo disponível a lista será resetada</Text>
                    <View style={styles.buttonsModal}>
                      <TouchableOpacity onPress={this.fecharModalConfig}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/cancel.png')} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={this.handleConfirmarConfig}>
                        <Image style={styles.botaoCheckIcone} source={require('./assets/confirm.png')} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
            </Modal>
          )}
        </View>
      );
    }

    // Renderize o conteúdo original enquanto o saldo não for confirmado
    return (
      <View style={styles.content}>
          <Text style={styles.tituloPrincipal}>Bem Vindo</Text>
          <Text style={styles.frase}>Para começar a usar o app digite o saldo inicial:</Text>
          <TextInputMask
            style={styles.input}
            type={'money'}
            placeholder="R$"
            keyboardType="numeric"
            value={this.state.valor}
            onChangeText={(text) => this.setState({ valor: text })}
          />
          <TouchableOpacity  style={styles.buttonConfirm} onPress={this.handleConfirmarInicial}>
            <View style={styles.buttonContent}>
              <Image style={styles.botaoCheckIcone} source={require('./assets/check.png')} />
              <Text style={styles.buttonText}>Confirme para começar a usar</Text>
            </View>
          </TouchableOpacity>
        </View>
    );
  }
  renderBtnConfig () {
    if (this.state.saldoConfirmado) {
      return (        
          <TouchableOpacity onPress={this.exibirModalConfig} style={styles.botaoCabecalho}>
              <Image style={styles.botaoIcone} source={require('./assets/cog.png')} />
          </TouchableOpacity>        
      );
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.tituloContainer}>
            <Text style={styles.titulo}>Se Poupe</Text>
            {this.renderBtnConfig()}
          </View>
          <Image style={styles.logo} source={require('./assets/porquinho2.png')} />
        </View>
         {this.renderContent()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  tituloModalConfirm: {
    fontWeight: 'bold',
    marginBottom: '15px'
  },
  tituloItemLista: {
    fontWeight: 'bold',
  },
  credito: {
    backgroundColor: '#DBFBE9',
    borderBottomColor: '#315FEB',
    borderBottomWidth: '1px',
    paddingVertical: '5px',
    paddingHorizontal: '10px',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  debito: {
    backgroundColor: '#FBD8D5',
    borderBottomColor: '#315FEB',
    borderBottomWidth: '1px',
    paddingVertical: '5px',
    paddingHorizontal: '10px',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  caption: {
    fontSize: '12px',
    marginBottom: '10px'
  },
  botaoCabecalho: {
    opacity: '0.4'
  },
  itemValue: {
    flexDirection: 'row',
  },
  rodapeItem: {
    flexDirection: 'row',
    marginRight: '10px'
  },
  greenSquare: {
    width: '20px',
    height: '20px',
    backgroundColor: '#DBFBE9'
  },
  redSquare: {
    width: '20px',
    height: '20px',
    backgroundColor: '#FBD8D5'
  },
  rodapeLista: {
    flexDirection: 'row',
    marginBottom: '10px'
  },
  lista: {
    borderColor: '#315FEB',
    borderWidth: '1px',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px'
  },
  buttonsModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  label: {
    fontWeight: 'bold'
  },
  modalInner: {
    backgroundColor: '#fff',
    width: '335px',
    height: 'auto',
    padding: '20px',
    borderRadius: '5px'
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    height: '100%',
    flexDirection:'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lancamentos: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10px'
  },
  antesDaLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '20px'
  },
  valorDisponivel: {
    fontSize: '20px'
  },
  saldoDisponivel: {
    fontWeight: 'bold',
    fontSize: '18px',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#315FEB',
    paddingVertical: '10px',
    paddingHorizontal: '20px',
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center'
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#fff',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  content: {
    padding: '20px',
  },
  tituloPrincipal: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '15px'
  },
  frase: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '290px',
    borderColor: '#315FEB',
    textAlign: 'center',
    borderRadius: 5,
    marginHorizontal: 'auto',
    backgroundColor: '#fff',
  },
  botaoIcone: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
  botaoCheckIcone: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: '5px'
  },
  buttonText: {
    textTransform: 'none',
    color: '#4BEB91',
    textAlign: 'center',
  },
  buttonConfirm: {
    borderColor:  '#4BEB91',
    borderRadius: 5,
    padding: 10,
    borderWidth: 1,
    textAlign: 'center',
    width: '285px',
    marginHorizontal: 'auto'
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
});