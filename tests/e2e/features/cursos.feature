# language: pt
Funcionalidade: Listagem de cursos
  Como visitante ou usuário autenticado
  Quero ver os cursos disponíveis
  Para escolher conteúdos do Transforme-se

  Cenário: Exibir cursos cadastrados no banco
    Dado que estou na página de cursos
    Então devo visualizar 2 cursos listados
    E devo visualizar o curso "Como controlar suas finanças" com descrição "Aprenda a ter controle total do seu dinheiro."
    E devo visualizar o curso "Montando a sua estratégia" com descrição "Aprenda a montar sua estratégia de marketing."
