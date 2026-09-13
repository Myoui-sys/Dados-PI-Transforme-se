# language: pt
Funcionalidade: Login de usuário
  Como QA do sistema Transforme-se
  Quero validar autenticação e sessão
  Para garantir acesso correto aos cursos

  @aprovado
  Cenário: Login com credenciais válidas
    Dado que estou na página de login
    Quando faço login com email "sabrina@gmail.com" e senha "123456"
    Então devo ser redirecionado para a página inicial
    E a sessão deve identificar o usuário "Sabrina Barros" com email "sabrina@gmail.com"
    E devo visualizar o usuário "Sabrina Barros" na página inicial

  @aprovado
  Cenário: Login com e-mail inexistente
    Dado que estou na página de login
    Quando faço login com email "nao.existe@teste.com" e senha "123456"
    Então devo ver a mensagem de login "Email inválido"

  @aprovado
  Cenário: Login com senha incorreta
    Dado que estou na página de login
    Quando faço login com email "sabrina@gmail.com" e senha "senha-errada"
    Então devo ver a mensagem de login "Senha incorreta"
