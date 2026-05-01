import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type StatusBadgeType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() type: StatusBadgeType = 'neutral';

  get statusClass(): string {
    return `status-${this.type}`;
  }
}

