# language: pt
Funcionalidade: Cadastro de usuário
  Como QA do sistema Transforme-se
  Quero validar o cadastro pela interface e pela API
  Para reduzir falhas antes da integração completa

  Cenário: Cadastrar um novo usuário pela interface
    Dado que estou na página de cadastro
    Quando preencho o cadastro com nome "QA", sobrenome "Automatizado", email "qa.automatizado@teste.com" e senha "123456"
    E envio o formulário de cadastro
    Então devo ver a mensagem de cadastro "E-mail cadastrado com sucesso!"

  Cenário: Impedir cadastro com e-mail já cadastrado
    Dado que estou na página de cadastro
    Quando preencho o cadastro com nome "Sabrina", sobrenome "Barros", email "sabrina@gmail.com" e senha "123456"
    E envio o formulário de cadastro
    Então devo ver a mensagem de cadastro "E-mail já cadastrado!"

  Cenário: Rejeitar cadastro incompleto enviado diretamente para a API
    Quando envio um cadastro incompleto diretamente para a API
    Então a API de cadastro deve rejeitar a solicitação
