/*
  Bestiário de Eivor, Mago da Corte de Windhelm: registro das criaturas.

  Para anotar uma fera nova, copie um dos blocos abaixo, cole no fim da lista
  (separado por vírgula) e troque os campos. O sumário e a numeração das
  páginas se ajustam sozinhos.

  Formato simples (como o Netch): "imagem" e "nota" para um único retrato.
  A fera ocupa duas páginas: o registro à esquerda e o retrato à direita.

  Formato com vários retratos (como os Dremoras): uma lista "retratos", cada um
  com imagem, legenda e nota. A fera ocupa quatro páginas: o registro, o
  primeiro retrato, o segundo retrato e uma página "O que se sabe" com os campos.

  Campos que aparecem nos registros, todos opcionais:
    espolio (lista ou texto), aviso, xp (Glória), bando, fraquezas, tatica,
    protecao, regiao, tipos (lista de { nome, texto }), runas.
  Apague os que não tiver. As imagens ficam na pasta assets/, de preferência
  com o fundo transparente.
*/
window.BESTIARIO = {
  // título curto (capa, folha de rosto e cabeçalho das feras) e complemento
  titulo: 'Bestiário de Eivor',
  subtitulo: 'Mago da Corte de Windhelm',
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
    },
    {
      id: 'dremora',
      nome: 'Dremoras',
      runas: 'ᛞᚱᛖᛗᛟᚱᚨ',
      descricao: 'Saem de fendas, vestidos de armaduras negras. Têm a pele vermelha e os olhos pretos, e andam em bandos de três a quinze, às vezes muitos mais. Há dois tipos, o guerreiro e o mago.',
      tipos: [
        { nome: 'Guerreiro', texto: 'Usa elmo com dois chifres, um mais baixo e outro mais alto, e luta com machado de duas mãos.' },
        { nome: 'Mago', texto: 'Não usa elmo e solta bolas de fogo. É muito forte.' }
      ],
      espolio: 'Ainda não sabemos o que é possível saquear deles',
      bando: 'De 3 a 15, ou muitos mais',
      fraquezas: 'Armas de prata são mais eficazes. Sob a luz do sol ficam mais fracos, e há suspeitas de que tochas também ajudem',
      tatica: 'Contra os magos, arcos à distância devem ajudar',
      protecao: 'Poções de resistência à magia. Para resistir ao fogo, amoras da neve ou línguas de dragão',
      regiao: 'Indefinida, pois vêm de fendas. A última aparição foi em Dawnstar',
      retratos: [
        { imagem: 'assets/dremora-guerreiro.webp', legenda: 'Dremora Guerreiro', nota: 'Armas de prata são mais eficazes contra eles.' },
        { imagem: 'assets/dremora-mago.webp', legenda: 'Dremora Mago', nota: 'O mago é muito forte. Mantenha distância e use o arco.' }
      ]
    }
  ]
};
