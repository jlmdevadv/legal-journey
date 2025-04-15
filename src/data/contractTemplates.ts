
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
    id: 'service-agreement',
    name: 'Contrato de Prestação de Serviços',
    description: 'Modelo básico para contrato de prestação de serviços entre empresas ou profissionais liberais e clientes.',
    fields: [
      {
        id: 'contractor-name',
        label: 'Nome do Contratante',
        type: 'text',
        placeholder: 'Digite o nome completo do contratante',
        required: true
      },
      {
        id: 'contractor-id',
        label: 'CPF/CNPJ do Contratante',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ do contratante',
        required: true
      },
      {
        id: 'contractor-address',
        label: 'Endereço do Contratante',
        type: 'text',
        placeholder: 'Digite o endereço completo do contratante',
        required: true
      },
      {
        id: 'provider-name',
        label: 'Nome do Prestador',
        type: 'text',
        placeholder: 'Digite o nome completo do prestador',
        required: true
      },
      {
        id: 'provider-id',
        label: 'CPF/CNPJ do Prestador',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ do prestador',
        required: true
      },
      {
        id: 'provider-address',
        label: 'Endereço do Prestador',
        type: 'text',
        placeholder: 'Digite o endereço completo do prestador',
        required: true
      },
      {
        id: 'service-description',
        label: 'Descrição dos Serviços',
        type: 'textarea',
        placeholder: 'Descreva detalhadamente os serviços a serem prestados',
        required: true
      },
      {
        id: 'contract-value',
        label: 'Valor do Contrato',
        type: 'text',
        placeholder: 'Digite o valor a ser pago pelos serviços',
        required: true
      },
      {
        id: 'payment-method',
        label: 'Forma de Pagamento',
        type: 'select',
        placeholder: 'Selecione a forma de pagamento',
        options: ['À vista', 'Parcelado', 'Mensal'],
        required: true
      },
      {
        id: 'start-date',
        label: 'Data de Início',
        type: 'date',
        placeholder: 'Selecione a data de início',
        required: true
      },
      {
        id: 'end-date',
        label: 'Data de Término',
        type: 'date',
        placeholder: 'Selecione a data de término',
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
    template: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Por este instrumento particular, de um lado [contractor-name], [person/legal-entity] inscrito(a) no CPF/CNPJ sob o nº [contractor-id], com sede/residência à [contractor-address], doravante denominado(a) CONTRATANTE, e de outro lado, [provider-name], [person/legal-entity] inscrito(a) no CPF/CNPJ sob o nº [provider-id], com sede/residência à [provider-address], doravante denominado(a) CONTRATADO(A), têm entre si justo e contratado o seguinte:

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem como objeto a prestação de serviços de [service-description], que serão prestados pelo(a) CONTRATADO(A) ao(à) CONTRATANTE.

CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO
Pelos serviços prestados, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) o valor de [contract-value], a ser pago da seguinte forma: [payment-method].

CLÁUSULA TERCEIRA - DO PRAZO
Os serviços serão prestados no período de [start-date] a [end-date], podendo ser prorrogado mediante acordo entre as partes.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO CONTRATADO
São obrigações do(a) CONTRATADO(A):
a) Prestar os serviços conforme especificados neste contrato;
b) Responsabilizar-se por todos os encargos trabalhistas, previdenciários, fiscais e comerciais resultantes da execução deste contrato;
c) Manter sigilo sobre todas as informações que tiver acesso em função da execução do contrato.

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATANTE
São obrigações do(a) CONTRATANTE:
a) Fornecer todas as informações necessárias para a execução dos serviços;
b) Efetuar o pagamento conforme estabelecido neste contrato;
c) Fiscalizar a execução dos serviços.

CLÁUSULA SEXTA - DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação expressa, com antecedência mínima de 30 dias, e também por acordo entre as partes a qualquer tempo.

CLÁUSULA SÉTIMA - DO FORO
As partes elegem o Foro da Comarca de [city]/[state] para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor, juntamente com 2 (duas) testemunhas.

[city]/[state], [signing-date]

________________________________
[contractor-name]
CONTRATANTE

________________________________
[provider-name]
CONTRATADO(A)

TESTEMUNHAS:

1. ________________________________
Nome:
CPF:

2. ________________________________
Nome:
CPF:`
  },
  {
    id: 'rent-agreement',
    name: 'Contrato de Locação de Imóvel',
    description: 'Modelo para locação de imóveis residenciais entre locador e locatário.',
    fields: [
      {
        id: 'owner-name',
        label: 'Nome do Proprietário',
        type: 'text',
        placeholder: 'Digite o nome completo do proprietário',
        required: true
      },
      {
        id: 'owner-id',
        label: 'CPF/CNPJ do Proprietário',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ do proprietário',
        required: true
      },
      {
        id: 'owner-address',
        label: 'Endereço do Proprietário',
        type: 'text',
        placeholder: 'Digite o endereço completo do proprietário',
        required: true
      },
      {
        id: 'tenant-name',
        label: 'Nome do Locatário',
        type: 'text',
        placeholder: 'Digite o nome completo do locatário',
        required: true
      },
      {
        id: 'tenant-id',
        label: 'CPF/CNPJ do Locatário',
        type: 'text',
        placeholder: 'Digite o CPF ou CNPJ do locatário',
        required: true
      },
      {
        id: 'tenant-address',
        label: 'Endereço do Locatário',
        type: 'text',
        placeholder: 'Digite o endereço completo do locatário',
        required: true
      },
      {
        id: 'property-address',
        label: 'Endereço do Imóvel',
        type: 'text',
        placeholder: 'Digite o endereço completo do imóvel',
        required: true
      },
      {
        id: 'property-description',
        label: 'Descrição do Imóvel',
        type: 'textarea',
        placeholder: 'Descreva detalhadamente o imóvel: área, cômodos, etc.',
        required: true
      },
      {
        id: 'rental-value',
        label: 'Valor do Aluguel',
        type: 'text',
        placeholder: 'Digite o valor mensal do aluguel',
        required: true
      },
      {
        id: 'rental-period',
        label: 'Prazo da Locação (meses)',
        type: 'number',
        placeholder: 'Digite o número de meses',
        required: true
      },
      {
        id: 'start-date',
        label: 'Data de Início',
        type: 'date',
        placeholder: 'Selecione a data de início',
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
    template: `CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL

Por este instrumento particular, de um lado [owner-name], [person/legal-entity] inscrito(a) no CPF/CNPJ sob o nº [owner-id], com sede/residência à [owner-address], doravante denominado(a) LOCADOR(A), e de outro lado, [tenant-name], [person/legal-entity] inscrito(a) no CPF/CNPJ sob o nº [tenant-id], com sede/residência à [tenant-address], doravante denominado(a) LOCATÁRIO(A), têm entre si justo e contratado o seguinte:

CLÁUSULA PRIMEIRA - DO OBJETO
O(A) LOCADOR(A) cede ao(à) LOCATÁRIO(A), mediante pagamento de aluguel, o imóvel de sua propriedade situado à [property-address], com as seguintes características: [property-description].

CLÁUSULA SEGUNDA - DO PRAZO
A presente locação terá o prazo de [rental-period] meses, iniciando-se em [start-date], e terminando em [calculated-end-date], data em que o(a) LOCATÁRIO(A) se obriga a restituir o imóvel completamente desocupado.

CLÁUSULA TERCEIRA - DO VALOR DO ALUGUEL
O aluguel mensal é de [rental-value], a ser pago até o dia 10 (dez) de cada mês, diretamente ao(à) LOCADOR(A) ou depositado em conta bancária a ser indicada.

CLÁUSULA QUARTA - DOS ENCARGOS E TRIBUTOS
Além do aluguel, o(a) LOCATÁRIO(A) se obriga a pagar pontualmente todas as despesas ordinárias de condomínio, bem como os encargos que incidirem sobre o imóvel, tais como consumo de água, energia elétrica, gás e telefone.

CLÁUSULA QUINTA - DA DESTINAÇÃO DO IMÓVEL
O imóvel objeto deste contrato destina-se exclusivamente para fins residenciais, não podendo o(a) LOCATÁRIO(A) utilizá-lo para outros fins, nem ceder, emprestar ou sublocar total ou parcialmente o imóvel, sem prévia autorização por escrito do(a) LOCADOR(A).

CLÁUSULA SEXTA - DA CONSERVAÇÃO DO IMÓVEL
O(A) LOCATÁRIO(A) recebe o imóvel em perfeitas condições de uso e se obriga a mantê-lo e restituí-lo nas mesmas condições, responsabilizando-se pelos danos que nele causar.

CLÁUSULA SÉTIMA - DAS BENFEITORIAS
O(A) LOCATÁRIO(A) não poderá fazer no imóvel quaisquer obras ou benfeitorias sem prévia autorização por escrito do(a) LOCADOR(A). As benfeitorias necessárias serão indenizadas pelo(a) LOCADOR(A); as úteis, se autorizadas, poderão ser levantadas pelo(a) LOCATÁRIO(A), finda a locação, desde que sua retirada não acarrete danos ao imóvel.

CLÁUSULA OITAVA - DA RESCISÃO
O presente contrato poderá ser rescindido antes do término de seu prazo, por acordo entre as partes ou mediante pagamento de multa no valor correspondente a três aluguéis, a ser paga pela parte que manifestar interesse na rescisão.

CLÁUSULA NONA - DO FORO
As partes elegem o Foro da Comarca de [city]/[state] para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor, juntamente com 2 (duas) testemunhas.

[city]/[state], [signing-date]

________________________________
[owner-name]
LOCADOR(A)

________________________________
[tenant-name]
LOCATÁRIO(A)

TESTEMUNHAS:

1. ________________________________
Nome:
CPF:

2. ________________________________
Nome:
CPF:`
  }
];
