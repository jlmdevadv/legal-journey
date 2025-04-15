
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  fields: ContractField[];
  template: string;
}

export interface ContractField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select';
  placeholder: string;
  options?: string[];
  required?: boolean;
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'understanding-memo',
    name: 'Memorando de Entendimentos',
    description: 'Modelo para estabelecer entendimentos preliminares entre parceiros de um projeto empresarial.',
    fields: [
      {
        id: 'partner1-name',
        label: 'Nome do Parceiro 1',
        type: 'text',
        placeholder: 'Digite o nome completo do primeiro parceiro',
        required: true
      },
      {
        id: 'partner1-id',
        label: 'CPF do Parceiro 1',
        type: 'text',
        placeholder: 'Digite o CPF do primeiro parceiro',
        required: true
      },
      {
        id: 'partner1-address',
        label: 'Endereço do Parceiro 1',
        type: 'text',
        placeholder: 'Digite o endereço completo do primeiro parceiro',
        required: true
      },
      {
        id: 'partner2-name',
        label: 'Nome do Parceiro 2',
        type: 'text',
        placeholder: 'Digite o nome completo do segundo parceiro',
        required: true
      },
      {
        id: 'partner2-id',
        label: 'CPF do Parceiro 2',
        type: 'text',
        placeholder: 'Digite o CPF do segundo parceiro',
        required: true
      },
      {
        id: 'partner2-address',
        label: 'Endereço do Parceiro 2',
        type: 'text',
        placeholder: 'Digite o endereço completo do segundo parceiro',
        required: true
      },
      {
        id: 'partner3-name',
        label: 'Nome do Parceiro 3',
        type: 'text',
        placeholder: 'Digite o nome completo do terceiro parceiro',
        required: true
      },
      {
        id: 'partner3-id',
        label: 'CPF do Parceiro 3',
        type: 'text',
        placeholder: 'Digite o CPF do terceiro parceiro',
        required: true
      },
      {
        id: 'partner3-address',
        label: 'Endereço do Parceiro 3',
        type: 'text',
        placeholder: 'Digite o endereço completo do terceiro parceiro',
        required: true
      },
      {
        id: 'project-name',
        label: 'Nome do Projeto',
        type: 'text',
        placeholder: 'Digite o nome do projeto empresarial',
        required: true
      },
      {
        id: 'project-domain',
        label: 'Domínio do Projeto',
        type: 'text',
        placeholder: 'Digite o domínio do projeto (ex: projeto.com.br)',
        required: true
      },
      {
        id: 'domain-owner',
        label: 'Detentor do Domínio',
        type: 'text',
        placeholder: 'Digite o nome do parceiro que detém o domínio',
        required: true
      },
      {
        id: 'project-description',
        label: 'Descrição do Projeto',
        type: 'textarea',
        placeholder: 'Descreva detalhadamente o projeto empresarial',
        required: true
      },
      {
        id: 'city',
        label: 'Cidade',
        type: 'text',
        placeholder: 'Digite a cidade onde o memorando está sendo assinado',
        required: true
      },
      {
        id: 'state',
        label: 'Estado',
        type: 'text',
        placeholder: 'Digite o estado onde o memorando está sendo assinado',
        required: true
      },
      {
        id: 'signing-date',
        label: 'Data de Assinatura',
        type: 'date',
        placeholder: 'Selecione a data da assinatura',
        required: true
      }
    ],
    template: `MEMORANDO DE ENTENDIMENTOS

Pelo presente instrumento, as Partes:
[partner1-name], brasileiro, portador da Cédula de Identidade Civil e inscrito no CPF sob nº [partner1-id], residente e domiciliado na [partner1-address];
[partner2-name], brasileiro, portador da Cédula de Identidade Civil e inscrito no CPF sob nº [partner2-id], residente e domiciliado na [partner2-address];
[partner3-name], brasileiro, portador da Cédula de Identidade Civil e inscrito no CPF sob nº [partner3-id], residente e domiciliado na [partner3-address];

Cláusula 1ª. Exposição sumária
1.1. As Partes acima qualificadas, em conjunto denominadas "Parceiros", têm por objetivo estabelecer entendimentos preliminares relativos à criação e desenvolvimento de um Projeto Empresarial denominado "[project-name]" ("Projeto"), visando, futuramente, à constituição de sociedade empresarial própria.
1.2. Este Acordo não constitui contrato social definitivo ou acordo de quotistas/acionistas, mas serve para delinear os compromissos e responsabilidades mínimas até que se formalize eventual sociedade empresária, inclusive com a possibilidade de registro de marca, divisão de participações, capital social e quaisquer outras providências formais.

Cláusula 2ª. Objeto Específico do Acordo
2.1. O presente Acordo tem por finalidade estabelecer as regras que regerão a relação entre as Partes na qualidade de parceiros e Parceiros do Projeto "[project-name]", abrangendo aspectos como:
2.1.1. Relação pessoal e profissional entre os Parceiros;
2.1.2. Distribuição de papéis e responsabilidades;
2.1.3. Regras de repartição de receitas e aportes, caso ocorram;
2.1.4. Uso do nome, domínio e eventual registro de marca "[project-name]";
2.1.5. Diretrizes sobre futura constituição de sociedade, caso o Projeto se expanda.

2.2. O Projeto se destina ao apoio e desenvolvimento de iniciativas em inovação e empreendedorismo, com foco em consultoria, mentorias, hackathons, ideathons, treinamentos e atividades correlatas, aproveitando a rede de contatos das Partes.

2.3. As Partes esclarecem que, embora já exista domínio registrado ([project-domain]), não há, por ora, registro formal de marca junto ao INPI. O Parceiro [domain-owner], detentor do domínio e idealizador original, coloca essa estrutura (nome, domínio e site em desenvolvimento) à disposição do grupo, com a condição de que futuramente se formalizem os termos de cessão ou transferência, de modo a integrar o patrimônio do Projeto (ou da sociedade a ser constituída).

2.4. As Partes encontram-se em fase de ideação, não havendo ainda CNPJ específico. Cada Fundador possui seu próprio CNPJ individual (ou registro de autônomo) e poderá, em caráter provisório, faturar contratos em nome de sua pessoa jurídica até que o Projeto adquira forma de sociedade.

2.5. Fica ajustado que este Memorando se aplica a quaisquer participações societárias ou quotas futuras que os Parceiros venham a deter na empresa "[project-name]" (caso constituída), bem como eventuais transformações societárias (mudança de tipo jurídico, cisão, fusão, incorporação).

Cláusula 3ª. Da Forma de Atuação e Gatilho para Abertura de CNPJ
3.1. As Partes concordam que a forma de atuação inicial será informal, com foco em validar serviços e oportunidades no mercado, sem constituir, por ora, nova pessoa jurídica exclusiva. Dessa forma, cada serviço poderá ser faturado via um dos CNPJ's dos Parceiros, conforme conveniência, acordo interno e região de atuação.

3.3. As Partes ajustam que avaliarão a necessidade de constituição formal de sociedade em prazo aproximado de 6 (seis) meses – ou caso surjam demandas e faturamento relevantes que exijam a presença de um CNPJ próprio, seja por exigência de clientes, seja para profissionalizar a operação. Uma vez constatada a viabilidade ou necessidade, iniciar-se-á o processo de abertura da pessoa jurídica e definição do capital social, participações e regras complementares.
3.3.1. Em ocorrendo a abertura do CNPJ, os Parceiros desde já acordam que a participação societária será igualitária entre eles.

Cláusula 4ª. Das Atribuições Específicas de Cada Sócio e Papéis Gerais
4.1. Sem prejuízo das funções específicas descritas nesta Cláusula, todos os Parceiros ([partner1-name], [partner2-name] e [partner3-name]) comprometem-se a:
4.1.1. Zelar pelo melhor interesse e pelo crescimento sustentável do Projeto, observando este Acordo e a legislação aplicável;
4.1.2. Promover ambiente de trabalho colaborativo, incentivando a troca de informações, o desenvolvimento profissional e o cumprimento das metas estabelecidas;
4.1.3. Manter sigilo acerca de informações estratégicas, dados sensíveis e quaisquer assuntos internos do Projeto;
4.1.4. Prestar contas e compartilhar informações relevantes aos demais Parceiros, de forma transparente e tempestiva, em especial quando houver riscos, custos ou obrigações que possam impactar o Projeto (ou eventual futura sociedade).
4.1.5. Cada Fundador é responsável pela execução das atividades de sua área de especialização, devendo prestar contas aos demais e zelar pelo bom andamento do Projeto em sua respectiva esfera de atuação.

Cláusula 5ª. Lucros, Divisão, Reinvestimentos e Pró-labore
5.1. Receita e Faturamento dos Contratos:
5.1.1. A cada contrato ou projeto prestado em nome do Projeto, os Parceiros decidirão de comum acordo qual CNPJ (de um dos Parceiros) será utilizado para emissão da nota fiscal e recebimento do pagamento. Em seguida, o valor recebido será primeiramente destinado ao pagamento de eventuais custos diretos, tais como deslocamentos, hospedagens, tributos e taxas específicas.

5.2. Porcentagem para o "Caixa":
5.2.1. Fica definido que, de cada receita gerada pelo Projeto, 25% (vinte e cinco por cento) será retido para compor o caixa do "[project-name]", de modo a cobrir despesas operacionais, custos de viagens, contador e outras necessidades.
5.2.2. Os 75% (setenta e cinco por cento) remanescentes serão distribuídos de forma igualitária entre os três Parceiros, cabendo 25% a cada um.

Cláusula 6ª. Da Administração do Projeto
6.1. Administração Conjunta e Escopo Geral:
6.1.1. O Projeto (ainda sem CNPJ próprio) será administrado pelos três Parceiros, em regime conjunto.
6.1.2. Cada Parceiro responderá prioritariamente por sua área de atuação, porém as questões de maior relevância ou impacto deverão ser deliberadas em conjunto, observando os critérios de votação previstos neste instrumento.

6.2. Decisões de Maior Relevância:
6.2.1. Exigirão unanimidade (isto é, assinatura ou concordância expressa dos três) as decisões que envolvam:
6.2.1.1. Empréstimos, financiamentos ou investimentos de grande monta, que possam resultar em obrigações significativas para o Projeto;
6.2.1.2. Contratação de colaboradores e fornecedores de alto custo ou que impliquem vínculo de longo prazo;
6.2.1.3. Despesas superiores a R$ 10.000,00 (dez mil reais) em um mesmo contrato ou conjunto de contratos correlatos;
6.2.1.4. Alienação ou oneração de bens relevantes e outras decisões com impacto patrimonial expressivo;
6.2.1.5. Entrada de novos Parceiros, cessão de participação ou qualquer alteração que modifique de forma substancial a composição do grupo;
6.2.1.6. Redefinição relevante do objeto do Projeto ou mudança estratégica de médio/longo prazo.

Cláusula 7ª. Da Prestação de Contas e das Reuniões
7.1. Prestação de Contas:
7.1.1. As decisões do dia a dia ficam a cargo do responsável de cada área, porém cada Parceiro deverá prestar contas das receitas e despesas pertinentes, fornecendo relatórios ou documentos que demonstrem a movimentação financeira, sempre que solicitado pelos demais ou conforme periodicidade definida em comum acordo.

Cláusula 8ª. Da Confidencialidade
8.1. As Partes obrigam-se a manter sigilo sobre quaisquer informações sensíveis ou estratégicas do Projeto (ou da futura Sociedade), adotando as medidas necessárias para impedir o acesso de terceiros não autorizados.

Cláusula 9ª. Solução de conflitos
9.1. Embora o presente Instrumento tenha sido elaborado para reger todas as disposições entre as Partes e prevenir conflitos, estes podem vir a ocorrer. Assim, as Partes comprometem-se a sempre buscar uma solução amigável antes de recorrer ao Judiciário, valendo-se de mediação ou outro método consensual de resolução de disputas.

9.2. Caso, após até 7 (sete) dias úteis de negociação direta, as Partes não alcancem acordo, deverão submeter o conflito a uma Câmara ou Plataforma de Mediação, no prazo de 10 (dez) dias úteis, ou tentar a mediação judicial, se assim entenderem mais adequado. Persistindo o impasse, fica autorizada a adoção das medidas judiciais cabíveis.

9.3. Para fins de ações judiciais relativas a este Acordo ou quaisquer questões que envolvam a Sociedade e as Partes, e não resolvidas por mediação, elege-se como foro único e exclusivo a Comarca de [city]/[state], com a renúncia expressa a qualquer outro, por mais privilegiado que seja.

Cláusula 10ª. Da Vigência do Presente Acordo e Rescisão
10.1. Este Memorando de Entendimentos vigorará até que a sociedade seja formalmente constituída, ou até que as partes decidam expressamente por sua rescisão. As obrigações de confidencialidade e não concorrência subsistem por 24 meses após o encerramento deste instrumento.

10.2. O presente Acordo é celebrado em caráter irrevogável e irretratável, podendo apenas ser renegociado por acordo escrito entre todos os Parceiros signatários deste instrumento.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 3 (três) vias de igual teor.

[city]/[state], [signing-date]

________________________________
[partner1-name]
CPF: [partner1-id]

________________________________
[partner2-name]
CPF: [partner2-id]

________________________________
[partner3-name]
CPF: [partner3-id]

TESTEMUNHAS:

1. ________________________________
Nome:
CPF:

2. ________________________________
Nome:
CPF:`
  },
  {
    id: 'confidentiality-agreement',
    name: 'Contrato de Confidencialidade',
    description: 'Modelo para proteção de informações confidenciais entre partes.',
    fields: [
      {
        id: 'disclosing-party-name',
        label: 'Nome da Parte Reveladora',
        type: 'text',
        placeholder: 'Digite o nome completo da parte que revelará informações',
        required: true
      },
      {
        id: 'disclosing-party-id',
        label: 'CPF/CNPJ da Parte Reveladora',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ da parte reveladora',
        required: true
      },
      {
        id: 'disclosing-party-address',
        label: 'Endereço da Parte Reveladora',
        type: 'text',
        placeholder: 'Digite o endereço completo da parte reveladora',
        required: true
      },
      {
        id: 'receiving-party-name',
        label: 'Nome da Parte Receptora',
        type: 'text',
        placeholder: 'Digite o nome completo da parte que receberá informações',
        required: true
      },
      {
        id: 'receiving-party-id',
        label: 'CPF/CNPJ da Parte Receptora',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ da parte receptora',
        required: true
      },
      {
        id: 'receiving-party-address',
        label: 'Endereço da Parte Receptora',
        type: 'text',
        placeholder: 'Digite o endereço completo da parte receptora',
        required: true
      },
      {
        id: 'confidentiality-purpose',
        label: 'Propósito da Confidencialidade',
        type: 'textarea',
        placeholder: 'Descreva a finalidade para a qual as informações confidenciais serão utilizadas',
        required: true
      },
      {
        id: 'confidentiality-period',
        label: 'Período de Confidencialidade (em meses)',
        type: 'number',
        placeholder: 'Digite o número de meses',
        required: true
      },
      {
        id: 'confidentiality-description',
        label: 'Descrição das Informações Confidenciais',
        type: 'textarea',
        placeholder: 'Descreva detalhadamente quais informações serão consideradas confidenciais',
        required: true
      },
      {
        id: 'penalty-value',
        label: 'Valor da Multa',
        type: 'text',
        placeholder: 'Digite o valor da multa em caso de violação',
        required: true
      },
      {
        id: 'start-date',
        label: 'Data de Início',
        type: 'date',
        placeholder: 'Selecione a data de início da vigência',
        required: true
      },
      {
        id: 'city',
        label: 'Cidade',
        type: 'text',
        placeholder: 'Digite a cidade onde o contrato está sendo assinado',
        required: true
      },
      {
        id: 'state',
        label: 'Estado',
        type: 'text',
        placeholder: 'Digite o estado onde o contrato está sendo assinado',
        required: true
      },
      {
        id: 'signing-date',
        label: 'Data de Assinatura',
        type: 'date',
        placeholder: 'Selecione a data da assinatura',
        required: true
      }
    ],
    template: `CONTRATO DE CONFIDENCIALIDADE

Pelo presente instrumento particular, de um lado:

[disclosing-party-name], pessoa [física/jurídica] inscrita no CPF/CNPJ sob o nº [disclosing-party-id], com [residência/sede] à [disclosing-party-address], doravante denominada "PARTE REVELADORA";

E, de outro lado:

[receiving-party-name], pessoa [física/jurídica] inscrita no CPF/CNPJ sob o nº [receiving-party-id], com [residência/sede] à [receiving-party-address], doravante denominada "PARTE RECEPTORA";

Ambas denominadas, em conjunto, como "PARTES" e, individualmente, como "PARTE", resolvem celebrar o presente Contrato de Confidencialidade ("Contrato"), que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente Contrato tem por objeto o estabelecimento de condições para a proteção e o sigilo das informações confidenciais trocadas entre as PARTES, em razão de [confidentiality-purpose], doravante denominado "PROPÓSITO".

1.2. Para os fins deste Contrato, são consideradas informações confidenciais: [confidentiality-description], bem como quaisquer outras informações que as PARTES identifiquem como sigilosas no momento de sua revelação, sejam elas transmitidas por escrito, oralmente, visualmente, eletronicamente ou por qualquer outro meio ("INFORMAÇÕES CONFIDENCIAIS").

CLÁUSULA SEGUNDA – DAS OBRIGAÇÕES DE CONFIDENCIALIDADE
2.1. A PARTE RECEPTORA compromete-se a:
a) Manter em sigilo absoluto todas as INFORMAÇÕES CONFIDENCIAIS recebidas da PARTE REVELADORA;
b) Utilizar as INFORMAÇÕES CONFIDENCIAIS única e exclusivamente para o PROPÓSITO estabelecido neste Contrato;
c) Não divulgar, publicar, ou de qualquer forma revelar as INFORMAÇÕES CONFIDENCIAIS a terceiros, sem a prévia e expressa autorização por escrito da PARTE REVELADORA;
d) Limitar o acesso às INFORMAÇÕES CONFIDENCIAIS apenas às pessoas que efetivamente necessitem ter conhecimento delas para a realização do PROPÓSITO, garantindo que tais pessoas estejam cientes das obrigações de confidencialidade assumidas neste Contrato;
e) Tomar todas as medidas de segurança razoáveis e adequadas para proteger as INFORMAÇÕES CONFIDENCIAIS contra uso, cópia ou divulgação não autorizados.

2.2. A PARTE RECEPTORA deverá informar imediatamente à PARTE REVELADORA sobre qualquer uso ou divulgação não autorizada das INFORMAÇÕES CONFIDENCIAIS de que venha a ter conhecimento.

CLÁUSULA TERCEIRA – DAS EXCEÇÕES
3.1. As obrigações de confidencialidade aqui estabelecidas não se aplicam às informações que:
a) Já sejam de domínio público no momento da divulgação ou que venham a se tornar públicas por outro meio que não por violação do presente Contrato;
b) Já eram de conhecimento da PARTE RECEPTORA antes de sua divulgação pela PARTE REVELADORA, desde que tal conhecimento prévio possa ser comprovado;
c) Tenham sido obtidas de forma legítima de terceiros que não tenham qualquer obrigação de confidencialidade com a PARTE REVELADORA;
d) Sejam desenvolvidas independentemente pela PARTE RECEPTORA sem o uso de qualquer INFORMAÇÃO CONFIDENCIAL;
e) Devam ser divulgadas por determinação judicial ou de autoridade governamental competente, desde que a PARTE RECEPTORA notifique previamente a PARTE REVELADORA sobre tal determinação, permitindo que esta adote as medidas cabíveis para evitar ou limitar a divulgação.

CLÁUSULA QUARTA – DO PRAZO
4.1. O presente Contrato vigorará pelo prazo de [confidentiality-period] meses, a contar da data de sua assinatura.

4.2. As obrigações de confidencialidade estabelecidas neste Contrato permanecerão em vigor pelo prazo de [confidentiality-period] meses após o término ou rescisão deste Contrato.

CLÁUSULA QUINTA – DA PROPRIEDADE DAS INFORMAÇÕES
5.1. Todas as INFORMAÇÕES CONFIDENCIAIS continuarão sendo de propriedade exclusiva da PARTE REVELADORA, e a PARTE RECEPTORA não adquirirá qualquer direito, título ou licença sobre tais informações.

5.2. A PARTE RECEPTORA concorda em devolver à PARTE REVELADORA, ou destruir, conforme solicitado, todas as INFORMAÇÕES CONFIDENCIAIS recebidas, incluindo cópias, reproduções ou outros materiais que contenham tais informações, dentro de 10 (dez) dias após o término ou rescisão deste Contrato, ou a qualquer momento mediante solicitação da PARTE REVELADORA.

CLÁUSULA SEXTA – DAS PENALIDADES
6.1. A PARTE RECEPTORA reconhece que o descumprimento de quaisquer obrigações estabelecidas neste Contrato poderá causar danos irreparáveis à PARTE REVELADORA, que terá direito a indenização por perdas e danos, sem prejuízo das medidas judiciais cabíveis para fazer cessar a violação.

6.2. Em caso de descumprimento do presente Contrato, a PARTE RECEPTORA pagará à PARTE REVELADORA multa no valor de [penalty-value], sem prejuízo das perdas e danos que venham a ser apurados.

CLÁUSULA SÉTIMA – DISPOSIÇÕES GERAIS
7.1. Este Contrato representa o entendimento integral entre as PARTES com relação ao assunto aqui tratado e substitui quaisquer acordos, entendimentos ou negociações anteriores.

7.2. Este Contrato não cria qualquer vínculo societário, associativo, de representação, agência ou de emprego entre as PARTES.

7.3. Nenhuma falha ou atraso no exercício de qualquer direito, poder ou privilégio decorrente deste Contrato será considerado como renúncia a tal direito, poder ou privilégio.

7.4. Se qualquer disposição deste Contrato for considerada inválida ou inexequível, tal invalidade ou inexequibilidade não afetará as demais disposições, que permanecerão em pleno vigor e efeito.

7.5. Este Contrato não poderá ser cedido ou transferido, no todo ou em parte, por qualquer das PARTES, sem o consentimento prévio e por escrito da outra PARTE.

7.6. Quaisquer modificações a este Contrato somente serão válidas se feitas por escrito e assinadas por ambas as PARTES.

CLÁUSULA OITAVA – DO FORO
8.1. As PARTES elegem o Foro da Comarca de [city]/[state] para dirimir quaisquer dúvidas ou controvérsias oriundas deste Contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as PARTES assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.

[city]/[state], [signing-date]

________________________________
[disclosing-party-name]
PARTE REVELADORA

________________________________
[receiving-party-name]
PARTE RECEPTORA

TESTEMUNHAS:

1. ________________________________
Nome:
CPF:

2. ________________________________
Nome:
CPF:`
  }
];

