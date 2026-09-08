# language: pt
@pendente
Funcionalidade: Integrações pendentes
  Como QA do sistema Transforme-se
  Quero documentar cenários ainda sem integração
  Para evitar reprovar funcionalidades que ainda não foram entregues

  @ignorado
  Cenário: Consultar saldos pela API
    Dado que a integração de "saldos" ainda não está disponível
    Então o cenário fica documentado como pendente para integração futura
