import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { HeaderComponent } from './core/layout/header/header.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { ProdutoListPageComponent } from './features/produtos/pages/produto-list-page/produto-list-page.component';
import { CategoriaListPageComponent } from './features/categorias/pages/categoria-list-page/categoria-list-page.component';
import { FornecedorListPageComponent } from './features/fornecedores/pages/fornecedor-list-page/fornecedor-list-page.component';
import { EstoqueMovimentacaoPageComponent } from './features/estoque/pages/estoque-movimentacao-page/estoque-movimentacao-page.component';
import { MovimentacaoListPageComponent } from './features/movimentacoes/pages/movimentacao-list-page/movimentacao-list-page.component';
import { EstoqueBaixoPageComponent } from './features/alertas/pages/estoque-baixo-page/estoque-baixo-page.component';

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardPageComponent,
    ProdutoListPageComponent,
    CategoriaListPageComponent,
    FornecedorListPageComponent,
    EstoqueMovimentacaoPageComponent,
    MovimentacaoListPageComponent,
    EstoqueBaixoPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
