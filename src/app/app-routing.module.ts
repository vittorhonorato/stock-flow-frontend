import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { ProdutoListPageComponent } from './features/produtos/pages/produto-list-page/produto-list-page.component';
import { CategoriaListPageComponent } from './features/categorias/pages/categoria-list-page/categoria-list-page.component';
import { FornecedorListPageComponent } from './features/fornecedores/pages/fornecedor-list-page/fornecedor-list-page.component';
import { EstoqueMovimentacaoPageComponent } from './features/estoque/pages/estoque-movimentacao-page/estoque-movimentacao-page.component';
import { MovimentacaoListPageComponent } from './features/movimentacoes/pages/movimentacao-list-page/movimentacao-list-page.component';
import { EstoqueBaixoPageComponent } from './features/alertas/pages/estoque-baixo-page/estoque-baixo-page.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardPageComponent,
        data: { title: 'Dashboard' }
      },
      {
        path: 'produtos',
        component: ProdutoListPageComponent,
        data: { title: 'Produtos' }
      },
      {
        path: 'categorias',
        component: CategoriaListPageComponent,
        data: { title: 'Categorias' }
      },
      {
        path: 'fornecedores',
        component: FornecedorListPageComponent,
        data: { title: 'Fornecedores' }
      },
      {
        path: 'estoque',
        component: EstoqueMovimentacaoPageComponent,
        data: { title: 'Movimentação de Estoque' }
      },
      {
        path: 'movimentacoes',
        component: MovimentacaoListPageComponent,
        data: { title: 'Histórico de Movimentações' }
      },
      {
        path: 'alertas/estoque-baixo',
        component: EstoqueBaixoPageComponent,
        data: { title: 'Produtos com Estoque Baixo' }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
