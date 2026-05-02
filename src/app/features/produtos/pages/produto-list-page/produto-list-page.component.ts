import { Component } from '@angular/core';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';

@Component({
  selector: 'app-produto-list-page',
  templateUrl: './produto-list-page.component.html',
  styleUrls: ['./produto-list-page.component.scss']
})
export class ProdutoListPageComponent {
  normalizarTermoBusca(event: Event): void {
    const input = event.target as HTMLInputElement | null;

    if (!input) {
      return;
    }

    input.value = BrInputMaskUtil.normalizeSpaces(input.value);
  }
}
