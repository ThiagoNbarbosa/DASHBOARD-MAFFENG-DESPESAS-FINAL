
import { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, FileText, Calendar, Target } from 'lucide-react';
import logoPath from "@assets/63f5d089-94db-4968-a76f-00d77b188818 (1)_1750213898122.png";

interface ReportData {
  expenses: any[];
  billing: any[];
  stats: {
    totalAmount: number;
    totalExpenses: number;
    categories: any[];
    monthly: any[];
    paymentMethods: any[];
  };
  period: {
    year: string;
    month: string;
  };
}

interface PdfReportTemplateProps {
  data: ReportData;
}

const PdfReportTemplate = forwardRef<HTMLDivElement, PdfReportTemplateProps>(({ data }, ref) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());
  };

  const getPeriodText = () => {
    if (data.period.month === "all") {
      return `Ano de ${data.period.year}`;
    }
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthIndex = parseInt(data.period.month) - 1;
    return `${monthNames[monthIndex]} de ${data.period.year}`;
  };

  // Calcular totais
  const totalReceitas = data.billing
    .filter(b => b.status === "pago")
    .reduce((sum, b) => sum + parseFloat(b.value || "0"), 0);

  const totalDespesas = data.expenses
    .filter(e => !e.category?.startsWith('[CANCELADA]'))
    .reduce((sum, e) => sum + parseFloat(e.value || "0"), 0);

  const lucroLiquido = totalReceitas - totalDespesas;
  const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;

  // Top 5 categorias
  const topCategorias = data.stats.categories
    .filter(c => !c.category.startsWith('[CANCELADA]'))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Contratos por valor
  const contratosPorValor = data.expenses
    .filter(e => !e.category?.startsWith('[CANCELADA]'))
    .reduce((acc: any, expense: any) => {
      const contract = expense.contractNumber || 'Sem Contrato';
      if (!acc[contract]) {
        acc[contract] = { total: 0, count: 0 };
      }
      acc[contract].total += parseFloat(expense.value || "0");
      acc[contract].count += 1;
      return acc;
    }, {});

  const topContratos = Object.entries(contratosPorValor)
    .map(([contract, data]: [string, any]) => ({
      contract,
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div ref={ref} className="bg-white p-8 min-h-screen" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Cabeçalho */}
      <header className="text-center mb-8 pb-6 border-b-2 border-orange-500">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src={logoPath} alt="MAFFENG Logo" className="h-16 w-20 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RELATÓRIO FINANCEIRO EXECUTIVO</h1>
            <p className="text-lg text-gray-600 mt-1">MAFFENG - Gestão Empresarial</p>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Período: {getPeriodText()}</span>
          <span>Gerado em: {formatDate()}</span>
        </div>
      </header>

      {/* Resumo Executivo */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-orange-600" />
          Resumo Executivo
        </h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">RECEITAS REALIZADAS</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(totalReceitas)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">DESPESAS TOTAIS</p>
                <p className="text-2xl font-bold text-red-800">{formatCurrency(totalDespesas)}</p>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-r ${lucroLiquido >= 0 ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100'} p-6 rounded-lg border-l-4 ${lucroLiquido >= 0 ? 'border-blue-500' : 'border-gray-500'}`}>
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-700">LUCRO LÍQUIDO</p>
                <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                  {formatCurrency(lucroLiquido)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">MARGEM DE LUCRO</p>
                <p className="text-2xl font-bold text-purple-800">{margemLucro.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Análise de Despesas por Categoria */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Análise de Despesas por Categoria</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Categoria</th>
                <th className="text-right py-2 font-semibold">Valor Total</th>
                <th className="text-right py-2 font-semibold">% do Total</th>
                <th className="text-right py-2 font-semibold">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {topCategorias.map((cat, index) => {
                const percentage = ((cat.total / totalDespesas) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 font-medium">{cat.category}</td>
                    <td className="text-right py-2">{formatCurrency(cat.total)}</td>
                    <td className="text-right py-2">{percentage}%</td>
                    <td className="text-right py-2">{cat.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Análise de Contratos */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 Análise por Contratos</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Contrato</th>
                <th className="text-right py-2 font-semibold">Valor Total</th>
                <th className="text-right py-2 font-semibold">% do Total</th>
                <th className="text-right py-2 font-semibold">Despesas</th>
              </tr>
            </thead>
            <tbody>
              {topContratos.map((contract, index) => {
                const percentage = ((contract.total / totalDespesas) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 font-medium">{contract.contract}</td>
                    <td className="text-right py-2">{formatCurrency(contract.total)}</td>
                    <td className="text-right py-2">{percentage}%</td>
                    <td className="text-right py-2">{contract.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Métodos de Pagamento */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Distribuição por Método de Pagamento</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Método</th>
                <th className="text-right py-2 font-semibold">Valor Total</th>
                <th className="text-right py-2 font-semibold">% do Total</th>
              </tr>
            </thead>
            <tbody>
              {data.stats.paymentMethods.map((method, index) => {
                const percentage = ((method.total / totalDespesas) * 100).toFixed(1);
                return (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 font-medium">{method.paymentMethod}</td>
                    <td className="text-right py-2">{formatCurrency(method.total)}</td>
                    <td className="text-right py-2">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Conclusões e Recomendações */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Conclusões e Recomendações</h2>
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-700">•</span>
              <p className="text-gray-700">
                <strong>Situação Financeira:</strong> {lucroLiquido >= 0 ? 
                  `A empresa apresenta resultado positivo de ${formatCurrency(lucroLiquido)} no período analisado.` :
                  `A empresa apresenta resultado negativo de ${formatCurrency(Math.abs(lucroLiquido))} no período analisado.`
                }
              </p>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-700">•</span>
              <p className="text-gray-700">
                <strong>Principal Categoria de Gastos:</strong> {topCategorias[0]?.category || 'N/A'} representa {((topCategorias[0]?.total || 0) / totalDespesas * 100).toFixed(1)}% dos gastos totais.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-700">•</span>
              <p className="text-gray-700">
                <strong>Margem de Lucro:</strong> {margemLucro >= 15 ? 
                  'Margem saudável, empresa bem posicionada financeiramente.' :
                  margemLucro >= 5 ? 
                  'Margem moderada, monitorar custos para melhorar rentabilidade.' :
                  'Margem baixa, revisar estratégias de redução de custos.'
                }
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-blue-700">•</span>
              <p className="text-gray-700">
                <strong>Total de Despesas:</strong> {data.stats.totalExpenses} despesas registradas no período com valor médio de {formatCurrency(totalDespesas / data.stats.totalExpenses)}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="mt-8 pt-6 border-t-2 border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Este relatório foi gerado automaticamente pelo sistema MAFFENG em {formatDate()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          © 2025 MAFFENG - Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
});

PdfReportTemplate.displayName = 'PdfReportTemplate';

export default PdfReportTemplate;
