# language: pt
@ciclo3
Funcionalidade: Novidades e regressões do ciclo 3
  Cenário: Visitante visualiza catálogo de assinaturas
    Quando abro a tela de assinaturas sem entrar
    Então vejo os planos em ordem de preço e o aviso de login

  Cenário: Usuário autenticado visualiza seu plano e pode trocar assinatura
    Dado que estou autenticado na API de cursos
    Quando abro a tela de assinaturas
    Então vejo meu plano atual e posso assinar o Premium

  Cenário: Imagens dos cursos usam largura corrigida
    Quando abro o catálogo de cursos do ciclo três
    Então todas as imagens dos cursos têm largura de 200 pixels
