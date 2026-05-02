import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PageHeaderComponent } from './shared/components/page-header/page-header.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { EmptyStateComponent } from './shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from './shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { CategoriaFormComponent } from './features/categorias/components/categoria-form/categoria-form.component';
import { CategoriaTableComponent } from './features/categorias/components/categoria-table/categoria-table.component';

@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardPageComponent,
    ProdutoListPageComponent,
    CategoriaListPageComponent,
    CategoriaTableComponent,
    CategoriaFormComponent,
    FornecedorListPageComponent,
    EstoqueMovimentacaoPageComponent,
    MovimentacaoListPageComponent,
    EstoqueBaixoPageComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    LoadingComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
