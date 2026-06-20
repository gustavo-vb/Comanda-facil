import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

import * as SQLite from 'expo-sqlite';

let db = null;

export default function App() {
  const [tela, setTela] = useState('inicio');

  const [mesas, setMesas] = useState([]);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);

  const [produto, setProduto] = useState('');
  const [preco, setPreco] = useState('');
  const [itens, setItens] = useState([]);

  useEffect(() => {
    iniciarBanco();
  }, []);

  async function iniciarBanco() {
    try {
      db = await SQLite.openDatabaseAsync('comanda_facil.db');

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mesas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero INTEGER NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS itens_comanda (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mesa_id INTEGER NOT NULL,
          produto TEXT NOT NULL,
          preco REAL NOT NULL,
          FOREIGN KEY (mesa_id) REFERENCES mesas(id)
        );
      `);

      await carregarMesas();
    } catch (erro) {
      console.log('Erro ao iniciar banco:', erro);
      Alert.alert('Erro', 'Não foi possível iniciar o banco de dados.');
    }
  }

  async function removerMesa(mesa) {
  Alert.alert(
    'Remover mesa',
    `Deseja remover a mesa ${String(mesa.numero).padStart(2, '0')}?\n\nTodos os produtos dessa mesa também serão apagados.`,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync(
              'DELETE FROM itens_comanda WHERE mesa_id = ?;',
              [mesa.id]
            );

            await db.runAsync(
              'DELETE FROM mesas WHERE id = ?;',
              [mesa.id]
            );

            await carregarMesas();
          } catch (erro) {
            console.log('Erro ao remover mesa:', erro);
            Alert.alert('Erro', 'Não foi possível remover a mesa.');
          }
        },
      },
    ]
  );
}

  async function carregarMesas() {
    try {
      const resultado = await db.getAllAsync(
        'SELECT * FROM mesas ORDER BY numero ASC;'
      );

      setMesas(resultado);
    } catch (erro) {
      console.log('Erro ao carregar mesas:', erro);
    }
  }

 async function adicionarMesa() {
  try {
    if (mesas.length >= 5) {
      Alert.alert(
        'Limite atingido',
        'Usuários grátis podem cadastrar até 5 mesas.'
      );
      return;
    }

    const numerosExistentes = mesas.map((mesa) => mesa.numero);

    let proximoNumero = 1;

    while (numerosExistentes.includes(proximoNumero)) {
      proximoNumero++;
    }

    await db.runAsync(
      'INSERT INTO mesas (numero) VALUES (?);',
      [proximoNumero]
    );

    await carregarMesas();
  } catch (erro) {
    console.log('Erro ao adicionar mesa:', erro);
    Alert.alert('Erro', 'Não foi possível adicionar a mesa.');
  }
}

  async function abrirMesa(mesa) {
    setMesaSelecionada(mesa);
    setTela('comanda');
    await carregarItens(mesa.id);
  }

  async function carregarItens(mesaId) {
    try {
      const resultado = await db.getAllAsync(
        'SELECT * FROM itens_comanda WHERE mesa_id = ? ORDER BY id DESC;',
        [mesaId]
      );

      setItens(resultado);
    } catch (erro) {
      console.log('Erro ao carregar itens:', erro);
    }
  }

  async function adicionarProduto() {
    try {
      if (!produto.trim()) {
        Alert.alert('Atenção', 'Informe o nome do produto.');
        return;
      }

      if (!preco.trim()) {
        Alert.alert('Atenção', 'Informe o preço do produto.');
        return;
      }

      const precoConvertido = Number(preco.replace(',', '.'));

      if (isNaN(precoConvertido) || precoConvertido <= 0) {
        Alert.alert('Atenção', 'Informe um preço válido.');
        return;
      }

      await db.runAsync(
        'INSERT INTO itens_comanda (mesa_id, produto, preco) VALUES (?, ?, ?);',
        [mesaSelecionada.id, produto.trim(), precoConvertido]
      );

      setProduto('');
      setPreco('');

      await carregarItens(mesaSelecionada.id);
    } catch (erro) {
      console.log('Erro ao adicionar produto:', erro);
      Alert.alert('Erro', 'Não foi possível adicionar o produto.');
    }
  }

  async function excluirItem(id) {
    try {
      await db.runAsync(
        'DELETE FROM itens_comanda WHERE id = ?;',
        [id]
      );

      await carregarItens(mesaSelecionada.id);
    } catch (erro) {
      console.log('Erro ao excluir item:', erro);
    }
  }

  async function fecharMesa() {
  const total = calcularTotal();

  if (itens.length === 0) {
    Alert.alert(
      'Mesa sem consumo',
      'Esta mesa não possui produtos lançados.'
    );
    return;
  }

  Alert.alert(
    'Fechamento da mesa',
    `Total da mesa ${String(mesaSelecionada.numero).padStart(2, '0')}: ${formatarMoeda(total)}\n\nO valor foi pago?`,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sim, foi pago',
        onPress: async () => {
          try {
            await db.runAsync(
              'DELETE FROM itens_comanda WHERE mesa_id = ?;',
              [mesaSelecionada.id]
            );

            setItens([]);
            setMesaSelecionada(null);
            setTela('mesas');
          } catch (erro) {
            console.log('Erro ao fechar mesa:', erro);
            Alert.alert('Erro', 'Não foi possível fechar a mesa.');
          }
        },
      },
    ]
  );
}

  function calcularTotal() {
    return itens.reduce((total, item) => total + item.preco, 0);
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function TelaInicio() {
    return (
      <SafeAreaView style={styles.containerInicio}>
        <Text style={styles.logo}>✏️</Text>

        <Text style={styles.tituloGrande}>COMANDA</Text>
        <Text style={styles.tituloGrande}>FÁCIL</Text>

        <Text style={styles.subtitulo}>Bem-vindo(a)</Text>

        <TouchableOpacity
          style={styles.botaoIniciar}
          onPress={() => setTela('mesas')}
        >
          <Text style={styles.textoBotaoIniciar}>INICIAR</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function TelaMesas() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topo}>
          <Text style={styles.tituloTopo}>MESAS</Text>
        </View>

        <View style={styles.conteudo}>
          <FlatList
            data={mesas}
            numColumns={3}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.areaCardMesa}>
                <TouchableOpacity
                  style={styles.cardMesa}
                  onPress={() => abrirMesa(item)}
                >
                  <Text style={styles.iconeMesa}>𓊯</Text>
                  <Text style={styles.numeroMesa}>
                    {String(item.numero).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoRemoverMesa}
                  onPress={() => removerMesa(item)}
                >
                  <Text style={styles.textoRemoverMesa}>X</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.textoVazio}>
                Nenhuma mesa cadastrada.
              </Text>
            }
          />

          <View style={styles.areaRodapeConteudo}>
            <Text style={styles.textoLimite}>
              Limite de 5 mesas para usuários grátis
            </Text>

            <TouchableOpacity
              style={styles.botaoCircular}
              onPress={adicionarMesa}
            >
              <Text style={styles.textoBotaoCircular}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BarraInferior telaAtual="mesas" />
      </SafeAreaView>
    );
  }

  function TelaConfiguracoes() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topo}>
          <Text style={styles.tituloTopo}>CONFIGURAÇÕES</Text>
        </View>

        <View style={styles.conteudoConfig}>
          <Text style={styles.emBreve}>{'< EM BREVE >'}</Text>
          <View style={styles.linha} />
          <Text style={styles.opcaoConfig}>Premium + Sem anúncios</Text>
          <Text style={styles.opcaoConfig}>Sincronizar com servidor desktop</Text>
          <Text style={styles.opcaoConfig}>Sincronizar com dispositivos na rede</Text>
        </View>

        <BarraInferior telaAtual="config" />
      </SafeAreaView>
    );
  }

  function TelaComanda() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topo}>
          <Text style={styles.tituloTopo}>REGISTRAR COMANDA DE MESA</Text>
        </View>

        <View style={styles.conteudoComanda}>
          <Text style={styles.label}>Número da mesa:</Text>
          <TextInput
            style={styles.input}
            value={mesaSelecionada ? String(mesaSelecionada.numero).padStart(2, '0') : ''}
            editable={false}
          />

          <View style={styles.cardFormulario}>
            <Text style={styles.label}>Produto consumido:</Text>
            <TextInput
              style={styles.input}
              value={produto}
              onChangeText={setProduto}
              placeholder="Ex: X-Burger"
            />

            <Text style={styles.label}>Preço:</Text>
            <TextInput
              style={styles.input}
              value={preco}
              onChangeText={setPreco}
              placeholder="Ex: 15,90"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.botaoAdicionarProduto}
              onPress={adicionarProduto}
            >
              <Text style={styles.textoBotaoPequeno}>Adicionar produto</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listaProdutos}>
            <Text style={styles.tituloLista}>Produtos consumidos:</Text>

            <FlatList
              data={itens}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={styles.itemProduto}>
                  <View>
                    <Text style={styles.nomeProduto}>{item.produto}</Text>
                    <Text style={styles.precoProduto}>
                      {formatarMoeda(item.preco)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botaoExcluirItem}
                    onPress={() => excluirItem(item.id)}
                  >
                    <Text style={styles.textoExcluir}>X</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.textoVazioLista}>
                  Nenhum produto adicionado.
                </Text>
              }
            />
          </View>

          <View style={styles.areaTotal}>
            <Text style={styles.textoTotal}>Total:</Text>
            <Text style={styles.valorTotal}>
              {formatarMoeda(calcularTotal())}
            </Text>
          </View>

          <View style={styles.areaBotoesComanda}>
            <TouchableOpacity
              style={styles.botaoVermelho}
              onPress={() => setTela('mesas')}
            >
              <Text style={styles.textoBotaoGrande}>Voltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVerde}
              onPress={fecharMesa}
            >
              <Text style={styles.textoBotaoGrande}>Fecha</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BarraInferior telaAtual="mesas" />
      </SafeAreaView>
    );
  }

  function BarraInferior({ telaAtual }) {
    return (
      <View style={styles.barraInferior}>
        <TouchableOpacity
          style={[
            styles.botaoMenu,
            telaAtual === 'mesas' && styles.botaoMenuAtivo,
          ]}
          onPress={() => setTela('mesas')}
        >
          <Text
            style={[
              styles.iconeMenu,
              telaAtual === 'mesas' && styles.iconeMenuAtivo,
            ]}
          >
            𓊯
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botaoMenu,
            telaAtual === 'config' && styles.botaoMenuAtivo,
          ]}
          onPress={() => setTela('config')}
        >
          <Text
            style={[
              styles.iconeMenuConfig,
              telaAtual === 'config' && styles.iconeMenuAtivo,
            ]}
          >
            ⛭
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (tela === 'inicio') return TelaInicio();
  if (tela === 'mesas') return TelaMesas();
  if (tela === 'config') return TelaConfiguracoes();
  if (tela === 'comanda') return TelaComanda();

  return TelaInicio();
}

const COR_FUNDO = '#FFD0AE';
const COR_PRETO = '#202020';

const styles = StyleSheet.create({
  containerInicio: {
    flex: 1,
    backgroundColor: COR_FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  logo: {
    fontSize: 80,
    marginBottom: 30,
  },

  tituloGrande: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COR_PRETO,
    lineHeight: 56,
  },

  subtitulo: {
    fontSize: 24,
    color: '#777',
    marginTop: 10,
    marginBottom: 80,
  },

  botaoIniciar: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 42,
    paddingVertical: 18,
    borderRadius: 5,
  },

  textoBotaoIniciar: {
    color: '#fff',
    fontSize: 24,
  },

  container: {
    flex: 1,
    backgroundColor: COR_FUNDO,
  },

  topo: {
    height: 58,
    backgroundColor: COR_FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloTopo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COR_PRETO,
  },

  conteudo: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
  },

  cardMesa: {
    width: 70,
    height: 70,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  iconeMesa: {
    fontSize: 34,
    color: '#000',
  },

  numeroMesa: {
    fontSize: 14,
    color: '#222',
  },

  textoVazio: {
    marginTop: 20,
    color: '#777',
  },

  areaRodapeConteudo: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },

  textoLimite: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },

  botaoCircular: {
    width: 42,
    height: 42,
    borderWidth: 3,
    borderColor: '#111',
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoBotaoCircular: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -4,
  },

  barraInferior: {
    height: 78,
    backgroundColor: COR_FUNDO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },

  botaoMenu: {
    width: 58,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoMenuAtivo: {
    backgroundColor: '#000',
  },

  iconeMenu: {
    fontSize: 36,
    color: '#000',
  },

  iconeMenuConfig: {
    fontSize: 46,
    color: '#000',
  },

  iconeMenuAtivo: {
    color: '#fff',
  },

  conteudoConfig: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },

  linha: {
    width: '80%',
    height: 1,
    backgroundColor: '#999',
    marginVertical: 36,
  },

  emBreve: {
    fontSize: 14,
    marginBottom: 28,
  },

  opcaoConfig: {
    color: '#999',
    fontSize: 14,
    marginVertical: 14,
  },

  conteudoComanda: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
    marginTop: 6,
  },

  input: {
    height: 38,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 16,
  },

  cardFormulario: {
    backgroundColor: COR_FUNDO,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },

  botaoAdicionarProduto: {
    backgroundColor: '#333',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },

  textoBotaoPequeno: {
    color: '#fff',
    fontSize: 14,
  },

  listaProdutos: {
    flex: 1,
    backgroundColor: COR_FUNDO,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 6,
    marginTop: 12,
    padding: 10,
  },

  tituloLista: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 14,
  },

  itemProduto: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nomeProduto: {
    fontWeight: 'bold',
    fontSize: 15,
  },

  precoProduto: {
    color: '#555',
    marginTop: 2,
  },

  botaoExcluirItem: {
    backgroundColor: '#ff3333',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoExcluir: {
    color: '#fff',
    fontWeight: 'bold',
  },

  textoVazioLista: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },

  areaTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  textoTotal: {
    fontWeight: 'bold',
    marginRight: 8,
  },

  valorTotal: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  areaBotoesComanda: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 8,
  },

  botaoVermelho: {
    width: 185,
    height: 55,
    backgroundColor: '#ff1f1f',
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoVerde: {
    width: 185,
    height: 55,
    backgroundColor: '#39ff14',
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoBotaoGrande: {
    fontSize: 46,
    fontWeight: 'bold',
    color: '#000',
    marginTop: -6,
  },

  areaCardMesa: {
  width: 80,
  height: 80,
  marginRight: 12,
  marginBottom: 12,
  marginTop: 12,
  position: 'relative',
},

  botaoRemoverMesa: {
    position: 'absolute',
    top: -8,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3333',
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoRemoverMesa: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
});