/*
  Bestiário de Windhelm: registro das criaturas.

  Para anotar uma fera nova, copie o bloco do Netch, cole logo abaixo dele
  (separado por vírgula) e troque os campos. Cada criatura ocupa duas páginas:
  o registro à esquerda e o retrato à direita. O sumário e a numeração das
  páginas se ajustam sozinhos.

  Campos opcionais podem ser apagados: runas, aviso, nota, imagem.
  As imagens ficam na pasta assets/ (de preferência com o fundo transparente).
*/
window.BESTIARIO = {
  titulo: 'Bestiário de Windhelm',
  livro: 'Livro Primeiro',
  // quem escreve o livro (aparece na folha de rosto e na assinatura do prefácio)
  autor: 'Eivor',
  cargo: 'Mago da Corte',
  criaturas: [
    {
      id: 'netch',
      nome: 'Netch',
      runas: 'ᚾᛖᛏᚲᚺ',
      imagem: 'assets/netch.webp',
      descricao: 'Vagam pelo ar como bexigas de couro, arrastando tentáculos pelos charcos. Os moradores de Windhelm os avistam perto de Riften, onde se reúnem em bandos de quatro adultos — um deles, o beta — acompanhados de dois menores.',
      espolio: ['Couro de Netch', 'Geleia de Netch'],
      aviso: 'Somente caçadores mestres conseguem tirar o couro.',
      xp: 191,
      bando: '4 adultos (1 beta) e 2 menores',
      tatica: 'Atacar do alto',
      regiao: 'Perto de Riften',
      nota: 'Fique acima deles. Os tentáculos não alcançam quem ataca do alto.'
    }
  ]
};
