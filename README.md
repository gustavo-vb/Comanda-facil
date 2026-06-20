# Comanda Fácil

Aplicativo mobile desenvolvido em **React Native** com **Expo Snack** para controle simples de comandas por mesa, usando **Firebase** como banco de dados em nuvem.

## Objetivo do projeto

O objetivo do **Comanda Fácil** é permitir o cadastro de mesas, o lançamento de produtos consumidos e o fechamento da mesa com cálculo automático do total. O projeto simula uma aplicação simples para lanchonetes, bares ou restaurantes.

## Tecnologias utilizadas

- React Native;
- Expo Snack;
- Firebase (Substituí o SQLite para dar mobilidade de conexão ao aplicativo);
- JavaScript.

## Funcionalidades

- Tela inicial do aplicativo;
- Cadastro de mesas;
- Listagem de mesas cadastradas;
- Remoção de mesas;
- Registro de produtos consumidos por mesa;
- Cadastro do nome do produto e preço;
- Listagem dos produtos consumidos;
- Cálculo automático do total da comanda;
- Remoção de produtos da comanda;
- Fechamento da mesa com confirmação de pagamento;
- Registro do fechamento no Firebase;
- Tela de configurações com opções futuras;
## Principais operações do sistema

### Criar mesa

Ao clicar no botão de adicionar mesa, o aplicativo cria um novo documento `mesas`.

### Abrir mesa

Ao tocar em uma mesa, o aplicativo abre a tela de comanda e carrega os itens de `itens`.

### Adicionar produto

Ao informar o nome do produto e o preço, o aplicativo cria um novo documento dentro de:

```txt
mesas/{idDaMesa}/itens
```

### Fechar mesa

Ao fechar a mesa, o aplicativo:

1. Calcula o total dos produtos.
2. Pergunta se o valor foi pago.
3. Registra o fechamento em `fechamentos`.
4. Remove os itens da mesa.
5. Marca a mesa como livre.

### Remover mesa

Ao remover uma mesa, o aplicativo apaga os produtos vinculados a ela e depois remove o documento da mesa.

## Justificativa da escolha do Firebase

O Firebase foi escolhido por permitir que os dados sejam armazenados em nuvem, facilitando a sincronização entre dispositivos.

## Atualizações futuras

- Login de usuários.
- Separação de comandas por funcionário.
- Histórico completo de fechamentos.
- Relatórios de vendas.
- Cadastro de produtos fixos.
- Controle de pagamentos.
- Sincronização em tempo real.
- Plano premium sem limite de mesas.
- Tela administrativa para acompanhar vendas.

## Autor

Gustavo Vilas Boas Pereira
