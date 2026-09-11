# language: pt
@backend @perfil_api
Funcionalidade: Consulta e edição do perfil no backend
  Como pessoa cadastrada
  Quero consultar e editar meu próprio perfil
  Para manter meus dados consistentes

  Contexto:
    Dado que existe um usuário exclusivo para este cenário de perfil

  @aprovado
  Cenário: Bloquear consulta de perfil sem autenticação
    Quando consulto meu perfil pela API
    Então a API deve responder com status 401
    E a API deve informar o erro "Não autenticado"

  @aprovado
  Cenário: Consultar os campos do próprio perfil sem expor senha
    Dado que estou autenticado com o usuário do cenário
    Quando consulto meu perfil pela API
    Então a API deve responder com status 200
    E devo receber somente os campos públicos do meu perfil

  @aprovado
  Cenário: Bloquear edição de perfil sem autenticação
    Dado que registrei o estado atual do banco de teste
    Quando envio uma edição válida de perfil pela API
    Então a API deve bloquear a edição não autenticada
    E a API deve informar o erro "Não autenticado"
    E o banco de teste deve permanecer inalterado

  @aprovado
  Cenário: Atualizar campos, sessão e persistência do próprio perfil
    Dado que estou autenticado com o usuário do cenário
    Quando envio uma edição válida de perfil pela API
    Então a API deve responder com status 200
    E a edição do perfil deve ser confirmada
    E os novos campos devem aparecer na consulta, na sessão e no banco
    E o identificador, a senha e os outros usuários devem ser preservados

  @aprovado
  Cenário: Impedir troca para e-mail de outro usuário
    Dado que estou autenticado com o usuário do cenário
    E que registrei o estado atual do banco de teste
    Quando tento alterar meu e-mail para " CARLOS@GMAIL.COM "
    Então a API deve bloquear o e-mail duplicado
    E a API deve informar o erro "Email já está sendo utilizado."
    E o banco de teste deve permanecer inalterado
    E a sessão deve manter meu e-mail original

  @aprovado
  Cenário: Trocar e-mail com normalização e atualizar a identidade de login
    Dado que estou autenticado com o usuário do cenário
    Quando altero meu e-mail para um novo endereço com maiúsculas e espaços
    Então a API deve responder com status 200
    E a edição do perfil deve ser confirmada
    E o e-mail normalizado deve substituir a chave antiga no banco e na sessão
    E devo conseguir entrar com o novo e-mail e não com o antigo

  @aprovado @regressao_ciclo3
  Cenário: Consultar perfil após login com maiúsculas e espaços
    Dado que entrei na API com meu e-mail em maiúsculas e espaços
    Quando consulto meu perfil pela API
    Então a API deve responder com status 200
    E devo receber somente os campos públicos do meu perfil

  @aprovado @regressao_ciclo3
  Cenário: Rejeitar edição sem e-mail
    Dado que estou autenticado com o usuário do cenário
    E que registrei o estado atual do banco de teste
    Quando envio uma edição de perfil sem e-mail
    Então a API deve responder com status 400
    E o banco de teste deve permanecer inalterado

  @aprovado @regressao_ciclo3
  Cenário: Rejeitar edição com e-mail inválido
    Dado que estou autenticado com o usuário do cenário
    E que registrei o estado atual do banco de teste
    Quando tento alterar meu e-mail para "email-invalido"
    Então a API deve responder com status 400
    E o banco de teste deve permanecer inalterado
