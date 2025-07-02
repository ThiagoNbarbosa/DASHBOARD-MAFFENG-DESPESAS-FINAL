## Prompt para o Replit: Configuração e Correção de Erros no Aplicativo de Despesas

Olá, Replit Agent!

Este prompt detalha as modificações e correções necessárias para o aplicativo de gerenciamento de despesas fornecido. O objetivo principal é configurar o aplicativo para usar categorias, contratos e formas de pagamento padronizadas, além de resolver problemas críticos de funcionalidade.

### 1. Contexto do Aplicativo

Foi fornecido um arquivo ZIP (`DASHBOARD-MAFFENG-DESPESAS.zip`) contendo a estrutura atual do aplicativo. Este arquivo foi descompactado para o diretório `/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS` para sua análise. A estrutura do aplicativo é a seguinte:

```
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS:
[Conteúdo do diretório, conforme `ls -R`]
```

### 2. Definição de Categorias, Contratos e Bancos Padrões

As definições de categorias, contratos e bancos devem ser baseadas nos dados extraídos da planilha `contratos,categoriasebancos.xlsx`. Os dados relevantes são:

**Contratos:**
```python
['BB DIVINÓPOLIS', 'BB MATO GROSSO', 'BB MATO GROSSO DO SUL', 'BB MATO GROSSO LOTE 2', 'BB SALINAS', 'BB SÃO PAULO', 'BB VALADARES', 'BB VARGINHA', 'CARRO ENGENHARIA MS', 'CORREIOS - GO', 'ESCRITÓRIO', 'IMPOSTO', 'SECRETARIA DA ADMINISTRAÇÃO', 'SECRETARIA DA ECONOMIA', 'SECRETARIA DA SAÚDE']
```

**Categorias:**
```python
['ADIANTAMENTO', 'ALIMENTAÇÃO', 'ALUGUEL DE EQUIPAMENTOS', 'ALUGUEL DE VEÍCULO', 'ART', 'ASSESSORIA JURÍDICA', 'COMBUSTÍVEL', 'CONFRATERNIZAÇÃO', 'CONTABILIDADE', 'DISTRIBUIÇÃO DE LUCROS', 'DOAÇÃO', 'EMPRÉSTIMOS', 'ENERGIA', 'ESTACIONAMENTO', 'FÉRIAS', 'FRETE', 'FUNCIONÁRIOS', 'GRATIFICAÇÃO', 'HOSPEDAGEM', 'IMPOSTO - CARRO', 'IMPOSTOS', 'IMPOSTOS - FGTS', 'IMPOSTOS - ISS', 'IMPRESSORAS', 'INTERNET', 'INSUMOS', 'LAVA-RÁPIDO', 'MANUTENÇÃO DE VEÍCULOS', 'MANUTENÇÃO PREDIAL', 'MATERIAL', 'MATERIAL - RIO BRILHANTE', 'MATERIAL DE PAPELARIA', 'MATERIAL DE SEGURANÇA - EPI', 'MEDICINA DO TRABALHO', 'MULTAS DE VEÍCULOS', 'PATRIMÔNIOS', 'PRESTADOR DE SERVIÇO', 'PRO LABORE', 'RECARDA APLICATIVO', 'REEMBOLSO', 'REEMBOLSO - MATERIAL', 'REEMBOLSO - PEDÁGIO', 'REEMBOLSO - UBER', 'RESCISÃO TRABALHISTA', 'SALÁRIO', 'SEGURO VEICULAR', 'SISTEMA', 'TAG - ESTACIONAMENTO', 'TAG - PEDÁGIO', 'UBER', 'VALE TRANSPORTE']
```

**Bancos:**
```python
['ALELO', 'BANCO DO BRASIL', 'SICREED']
```

**Formas de Pagamento:**
```python
['Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Transferência Bancária', 'PIX']
```

Você deve identificar os locais apropriados no código-fonte do aplicativo para incorporar essas listas, garantindo que as opções de seleção para categorias, contratos, bancos e formas de pagamento sejam padronizadas em todas as interfaces relevantes. Isso inclui, mas não se limita aos seguintes arquivos:

```
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/components/edit-expense-modal.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/components/expense-modal.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/components/expense-table.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/components/expenses-by-contract.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/pages/faturamento.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/pages/final.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/pages/relatorios.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/client/src/pages/results.tsx
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/billing-storage.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/init-billing.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/routes.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/storage-pg-backup.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/storage-pg.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/server/storage.ts
/home/ubuntu/app_despesas/DASHBOARD-MAFFENG-DESPESAS/shared/schema.ts
```

### 3. Problemas Atuais e Soluções Necessárias

Atualmente, o aplicativo apresenta dois problemas críticos:

*   **Não é possível salvar despesas:** A funcionalidade de registro de novas despesas está inoperante. Você deve investigar o código-fonte para identificar a causa raiz e implementar a correção necessária para que as despesas possam ser salvas com sucesso no banco de dados.

*   **Não é possível importar a planilha de despesas:** A funcionalidade de importação de planilhas está falhando. A planilha de modelo (`modelo.xlsx`) e a planilha de dados (`contratos,categoriasebancos.xlsx`) foram fornecidas para sua referência. A estrutura da planilha de modelo é a seguinte:

    *   A planilha possui um cabeçalho na linha 4, com as colunas `NOME`, `VALOR`, `CATEGORIA`, `CONTRATO`, `FORMA DE PAGAMENTO` e `BANCO`.
    *   Os dados começam a partir da linha 5.

    Você deve garantir que o aplicativo consiga ler e processar corretamente os dados de uma planilha com essa estrutura, mapeando as colunas para os campos correspondentes no banco de dados e salvando as despesas importadas. Qualquer validação de dados necessária durante a importação também deve ser implementada.

### 4. Tarefas para o Replit Agent

Com base nas informações acima, o Replit Agent deve realizar as seguintes tarefas:

1.  **Analisar o código-fonte:** Entender a arquitetura do aplicativo e identificar os módulos e arquivos relevantes para as modificações.
2.  **Implementar as listas padronizadas:** Inserir as listas de `contratos`, `categorias`, `bancos` e `formas_pagamento` nos locais apropriados do código, garantindo que sejam utilizadas em todas as interfaces de usuário e lógicas de negócio.
3.  **Corrigir a funcionalidade de salvar despesas:** Diagnosticar e resolver o problema que impede o salvamento de despesas.
4.  **Implementar a funcionalidade de importação de planilhas:** Desenvolver ou corrigir o código para permitir a importação de planilhas Excel com a estrutura especificada, garantindo que os dados sejam corretamente lidos, validados e salvos.
5.  **Testar as funcionalidades:** Realizar testes para garantir que as despesas podem ser salvas e importadas com sucesso, e que as listas padronizadas estão sendo utilizadas corretamente.

Por favor, forneça um resumo das alterações realizadas e instruções sobre como testar as novas funcionalidades após a implementação. Se houver a necessidade de alguma configuração de ambiente ou instalação de dependências, por favor, inclua essas informações também.

Obrigado!

