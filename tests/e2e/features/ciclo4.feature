# language: pt
@ciclo4
Funcionalidade: Regressões e novas integrações do ciclo 4
  Como equipe do Projeto Integrador Transforme-se
  Quero validar as correções anteriores e as novas áreas
  Para saber o que está pronto para integrar ao front-end

  @aprovado
  Cenário: Confirmar a correção da consulta do plano atual
    Dado que estou autenticado para o ciclo quatro
    Quando consulto meu plano atual no ciclo quatro
    Então a consulta do ciclo quatro deve responder com status 200
    E devo receber um plano válido

  @reprovado
  Cenário: Preservar tarefa inteira quando a edição contém status inválido
    Dado que estou autenticado para o ciclo quatro
    E criei uma tarefa para testar edição inválida
    Quando edito a tarefa com título novo e status inválido
    Então a consulta do ciclo quatro deve responder com status 400
    E a tarefa deve permanecer totalmente inalterada

  @reprovado
  Cenário: Preservar evento inteiro quando a edição contém título vazio
    Dado que estou autenticado para o ciclo quatro
    E criei um evento para testar edição inválida
    Quando edito o evento com data nova e título vazio
    Então a consulta do ciclo quatro deve responder com status 400
    E o evento deve permanecer totalmente inalterado

  @reprovado
  Cenário: Rejeitar evento com dia inexistente
    Dado que estou autenticado para o ciclo quatro
    Quando crio um evento com a data inexistente "2026-02-30"
    Então a consulta do ciclo quatro deve responder com status 400

  @aprovado
  Cenário: Consultar resumo financeiro do mês
    Dado que estou autenticado para o ciclo quatro
    Quando consulto o resumo financeiro de setembro de 2026
    Então a consulta do ciclo quatro deve responder com status 200
    E o resumo deve apresentar entradas, saídas e lucro corretos

  @reprovado
  Cenário: Carregar o resumo financeiro da página inicial sem erro de integração
    Dado que estou autenticado para o ciclo quatro
    Quando abro a página inicial monitorando erros
    Então devo visualizar o nome do usuário na página inicial
    E a página inicial não deve registrar erro ao carregar o resumo

  @aprovado
  Cenário: Registrar e listar movimentação financeira
    Dado que estou autenticado para o ciclo quatro
    Quando registro uma entrada financeira válida
    Então a consulta do ciclo quatro deve responder com status 201
    E a movimentação deve aparecer na lista do usuário

  @aprovado
  Cenário: Registrar movimentação pela tela financeira
    Dado que estou autenticado para o ciclo quatro
    Quando adiciono uma entrada pela página financeira
    Então devo ver a confirmação e a movimentação na tela

  @reprovado
  Cenário: Rejeitar movimentação financeira com dia inexistente
    Dado que estou autenticado para o ciclo quatro
    Quando registro uma movimentação financeira na data "2026-02-30"
    Então a consulta do ciclo quatro deve responder com status 400

  @aprovado
  Cenário: Pesquisar conteúdo na Central de Ajuda
    Quando pesquiso "financeiro" na Central de Ajuda pela API
    Então a consulta do ciclo quatro deve responder com status 200
    E devo receber perguntas relacionadas ao termo pesquisado

  @reprovado
  Cenário: Rejeitar busca contendo somente espaços
    Quando pesquiso somente espaços na Central de Ajuda pela API
    Então a consulta do ciclo quatro deve responder com status 400

  @aprovado
  Cenário: Abrir e consultar ticket de suporte
    Dado que estou autenticado para o ciclo quatro
    Quando abro um ticket válido pela API
    Então a consulta do ciclo quatro deve responder com status 200
    E o ticket deve aparecer somente para o usuário autenticado

  @aprovado
  Cenário: Salvar os dados do negócio no Meu MEI
    Dado que estou autenticado para o ciclo quatro
    Quando salvo informações válidas do meu negócio
    Então a consulta do ciclo quatro deve responder com status 200
    E as informações do negócio devem ser persistidas

  @aprovado
  Cenário: Visualizar obrigações na interface
    Quando abro a página de obrigações no ciclo quatro
    Então devo visualizar as obrigações cadastradas

  @aprovado
  Cenário: Visualizar a Central de Ajuda na interface
    Quando abro a Central de Ajuda no ciclo quatro
    Então devo visualizar categorias e perguntas frequentes
