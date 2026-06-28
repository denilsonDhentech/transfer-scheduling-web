# Sistema de Agendamento de Transferências — Frontend

Interface web para agendamento e consulta de transferências financeiras, consumindo a API REST do backend Spring Boot.

## Tecnologias e versões

| Ferramenta       | Versão              |
| ---------------- | ------------------- |
| Node.js          | 24.x (mínimo: 18)   |
| Vue              | 3.5.39              |
| TypeScript       | 6.0.3               |
| Vite             | 8.1.0               |
| Vue Router       | 4.6.4               |
| Axios            | 1.18.1              |
| Vitest           | 4.1.9               |
| @vue/test-utils  | 2.4.11              |

## Decisões arquiteturais

### Composition API com `<script setup>`

Adotada em todos os componentes por ser a forma idiomática do Vue 3: melhor inferência de tipos com TypeScript, sem a necessidade de `defineComponent`, e lógica mais fácil de extrair e testar.

### Separação de responsabilidades por camada

```text
src/
├── api/        ← chamadas HTTP (Axios). Componentes nunca chamam o Axios diretamente.
├── types/      ← interfaces TypeScript espelhando o contrato do backend.
├── utils/      ← funções puras (validação e formatação), isoladas do Vue e testáveis de forma unitária.
├── components/ ← TransferForm e TransferList, responsáveis pela lógica e apresentação.
├── views/      ← wrappers de rota que compõem os componentes.
└── router/     ← definição das rotas.
```

### Sem biblioteca de UI

CSS puro com `<style scoped>` por componente. Mantém o bundle pequeno e evita dependências pesadas desnecessárias para a escala do projeto.

### CSS Custom Properties para dark mode

Todas as cores são definidas como variáveis em `:root` (tema claro) e sobrescritas em `html.dark` (tema escuro). A troca de tema é feita por um toggle no header e persiste entre sessões via `localStorage`.

### Proxy Vite com `changeOrigin`

Requisições para `/transfers` são redirecionadas pelo Vite para `http://localhost:8080` em tempo de desenvolvimento. A opção `changeOrigin: true` é necessária para que o cabeçalho `Host` seja reescrito corretamente — sem ela, métodos como `PATCH` são rejeitados pelo Spring Boot com 403.

### Validação local antes da chamada HTTP

Contas (10 dígitos numéricos), valor (positivo) e data (entre hoje e D+50) são validados no frontend antes de qualquer requisição, com mensagens de erro por campo.

## Como executar

### Pré-requisitos

- Node.js 18 ou superior
- Backend Spring Boot rodando em `http://localhost:8080`

### Instalação e execução

```bash
# Na raiz do projeto frontend
npm install
npm run dev
```

Acesse `http://localhost:5173` no browser.

### Build para produção

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`.

## Testes

```bash
# Executa todos os testes uma vez
npx vitest run

# Executa em modo watch (durante desenvolvimento)
npx vitest
```

A suíte cobre 101 casos distribuídos em 5 arquivos:

- `transferValidation.spec.ts` — funções de validação (unitários)
- `transferApi.spec.ts` — camada `api/` com mock do Axios (unitários), incluindo simulação, cancelamento, edição e busca por ID
- `TransferForm.spec.ts` — formulário de agendamento e simulação de taxa (componente)
- `TransferList.spec.ts` — extrato: renderização, skeleton, ordenação, filtros, paginação, exportação, cancelamento e edição (componente)
- `EditTransferModal.spec.ts` — modal de edição: pré-preenchimento, validações, submit, toasts de sucesso e erro (componente)

## Funcionalidades

- **Agendar transferência** (`/`): formulário com validação local, exibe as contas mascaradas, o valor, a taxa calculada e a data de agendamento após sucesso, e mensagens de erro da API em caso de falha.
- **Simular taxa** (`/`): botão no formulário que consulta `POST /transfers/simulate` e exibe a taxa estimada e o prazo em dias antes de confirmar o agendamento.
- **Extrato** (`/statement`): tabela paginada com todos os agendamentos, exibindo contas mascaradas e status com badge colorido (Pendente, Executado, Cancelado).
- **Filtros no extrato**: filtros por status, intervalo de datas e conta origem/destino, aplicados via query params no backend.
- **Paginação**: controles Anterior/Próxima com indicador de página e total de registros.
- **Ordenação de colunas**: clique no cabeçalho para ordenar por qualquer coluna; segundo clique inverte a direção.
- **Skeleton loading**: animação de carregamento nas linhas da tabela enquanto a requisição está em andamento.
- **Exportar CSV**: botão que chama `GET /transfers/export` e dispara o download do arquivo.
- **Cancelar agendamento**: botão "Cancelar" em todas as linhas — habilitado apenas para PENDING, com modal de confirmação antes de executar.
- **Editar agendamento**: botão "Editar" em todas as linhas — habilitado apenas para PENDING; abre modal pré-preenchido para alterar valor e/ou data, recalculando a taxa via `PATCH /transfers/{id}`.
- **Toasts globais**: notificações de sucesso e erro exibidas via composable `useToast`, sem dependência de biblioteca de UI.
- **Dark mode**: alternância de tema claro/escuro persistida no `localStorage`.
