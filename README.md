# Corretor de Prova

Aplicativo web para correcao automatica de provas de multipla escolha. Funciona diretamente no navegador, sem necessidade de instalacao ou servidor.

---

## Como usar

### Passo 1 — Configurar o Gabarito

1. Abra o arquivo `index.html` no navegador
2. Informe o **numero de questoes** (1 a 100) e clique em **Gerar**
3. Defina a **nota minima de aprovacao** (padrao: 6)
4. Para cada questao, selecione a **resposta correta** (A, B, C, D ou E)
5. Ajuste o **peso** de cada questao conforme necessario (padrao: 1)
6. Clique em **Confirmar Gabarito**

> Dica: clique em **Exemplo** para carregar automaticamente um gabarito com 15 alunos de teste.

---

### Passo 2 — Inserir Respostas dos Alunos

**Manualmente:**
1. Digite o nome do aluno no campo e clique em **+ Adicionar Aluno**
2. Marque as respostas de cada questao
3. Repita para todos os alunos

**Via CSV:**
1. Clique em **Baixar modelo CSV** para obter o arquivo no formato correto
2. Preencha o arquivo com os nomes e respostas dos alunos
3. Clique em **Importar CSV** e selecione o arquivo preenchido

**Formato do CSV:**
```
Nome,Q1,Q2,Q3,...
Ana Silva,A,C,B,...
Bruno Costa,B,A,C,...
```

---

### Passo 3 — Ver Resultados

Apos inserir os alunos, clique em **Ver Resultados**. A tela de resultados possui tres abas:

#### Aba: Resultados
- Resumo geral da turma (media, aprovados, pontos totais)
- Ranking dos alunos ordenado por nota
- Detalhamento por questao (acertos, erros, em branco)
- Grafico de desempenho com linha de aprovacao

#### Aba: Por Questao
- Percentual de acerto de cada questao
- Distribuicao das respostas marcadas pelos alunos
- Identifica as questoes mais dificeis da turma

#### Aba: Revisao
- Selecione um aluno para ver a comparacao questao por questao
- Exibe o gabarito ao lado da resposta do aluno
- Destaca respostas erradas em vermelho

---

## Salvar e Carregar Provas

- **Salvar prova:** exporta um arquivo `.json` com gabarito, respostas e nota minima
- **Carregar prova:** importa um `.json` salvo anteriormente e restaura tudo

---

## Exportar Resultados

| Opcao | Descricao |
|---|---|
| **Exportar CSV** | Planilha com nome, nota, pontos, acertos, erros e brancos de cada aluno |
| **Exportar PDF** | Relatorio completo em PDF com cabecalho, tabelas e estatisticas por questao |
| **Imprimir** | Abre a caixa de impressao do navegador com layout otimizado |

> O botao **Exportar PDF** requer conexao com a internet para carregar a biblioteca de geracao de PDF.

---

## Criterios de Avaliacao

- A **nota** e calculada de 0 a 10 com base nos pontos obtidos em relacao ao total de pontos da prova
- Formula: `nota = (pontos obtidos / pontos totais) * 10`
- Questoes sem resposta (em branco) nao somam nem subtraem pontos
- A **nota minima** de aprovacao e configuravel no Passo 1

---

## Requisitos

- Navegador moderno (Chrome, Edge, Firefox ou Safari)
- Conexao com internet apenas para o botao **Exportar PDF**
- Nenhuma instalacao necessaria

---

## Arquivos do Projeto

```
provaaprova/
├── index.html   — estrutura das telas
├── style.css    — estilos e layout responsivo
├── app.js       — logica do aplicativo
└── README.md    — este arquivo
```
