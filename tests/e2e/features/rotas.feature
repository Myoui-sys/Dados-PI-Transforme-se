# language: pt
Funcionalidade: Rotas públicas amigáveis
  Como pessoa usuária do sistema
  Quero acessar as páginas por rotas simples
  Para navegar sem conhecer a estrutura interna de arquivos

  @aprovado
  Cenário: Acessar rota amigável de cadastro
    Quando acesso a rota pública "/cadastro"
    Então a resposta HTTP deve ser 200

  @aprovado
  Cenário: Acessar rota amigável de login
    Quando acesso a rota pública "/login"
    Então a resposta HTTP deve ser 200

  @aprovado
  Cenário: Acessar rota amigável de cursos
    Quando acesso a rota pública "/cursos"
    Então a resposta HTTP deve ser 200
