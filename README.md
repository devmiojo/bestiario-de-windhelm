# Bestiário de Windhelm

Um livro antigo de couro para folhear no navegador. Nele estão as feras de Skyrim anotadas por Eivor, Mago da Corte, com a ajuda de todos os moradores de Windhelm.

**Abrir o livro:** https://devmiojo.github.io/bestiario-de-windhelm/

## Como folhear

- Clique na página da direita para avançar e na da esquerda para voltar. Também dá para arrastar a borda da folha com o mouse.
- As setas do teclado viram as páginas. **S** abre o sumário, **M** liga ou desliga o som e **Esc** fecha o livro.
- No celular, deslize o dedo para os lados.

## Como anotar uma fera nova

1. Coloque a ilustração na pasta `assets/`, de preferência com o fundo transparente.
2. Em `criaturas.js`, copie o bloco do Netch, cole logo abaixo dele e troque os campos.
3. Envie a mudança para o GitHub. O site se atualiza sozinho em cerca de um minuto.

O sumário e a numeração das páginas se ajustam sozinhos. Cada fera ocupa uma página dupla: o registro à esquerda e o retrato à direita.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `index.html` | A página do livro |
| `estilo.css` | A aparência do couro, do pergaminho e da escrita |
| `livro.js` | Monta as páginas, desenha as texturas e vira as folhas |
| `criaturas.js` | Os registros das feras, o autor e o título |
| `assets/` | As ilustrações |

O site não precisa de instalação nem de compilação. Para ver no seu computador, basta abrir o `index.html` no navegador.
