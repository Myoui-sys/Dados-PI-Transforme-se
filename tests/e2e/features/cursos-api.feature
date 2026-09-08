# language: pt
@backend @cursos_api
Funcionalidade: Consulta do catálogo no backend de cursos
  Como consumidor da API
  Quero consultar os cursos disponíveis
  Para receber o catálogo sem alterar os dados

  @aprovado
  Cenário: Consultar o catálogo sem autenticação
    Quando consulto o catálogo pela API
    Então a API deve responder com status 200
    E devo receber o catálogo completo em JSON

  @aprovado
  Cenário: Consultar o catálogo com autenticação
    Dado que estou autenticado na API de cursos
    Quando consulto o catálogo pela API
    Então a API deve responder com status 200
    E devo receber o catálogo completo em JSON

  @aprovado
  Cenário: Preservar os dados ao consultar cursos
    Dado que registrei o estado atual do banco de teste
    Quando consulto o catálogo pela API
    Então a API deve responder com status 200
    E o banco de teste deve permanecer inalterado
