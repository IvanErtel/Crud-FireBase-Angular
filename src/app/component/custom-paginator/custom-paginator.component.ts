import { Component, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-custom-paginator',
  standalone: true,
  imports: [MatPaginatorModule],
  templateUrl: './custom-paginator.component.html',
  styleUrls: ['./custom-paginator.component.scss']
})
export class CustomPaginatorComponent implements AfterViewInit, OnChanges {
  @Input() data: any[] = []; // Todos los productos
  @Input() pageSize: number = 10; // Tamaño de página
  @Input() pageSizeOptions: number[] = [5, 10, 25]; // Opciones de tamaño de página
  @Output() pageData = new EventEmitter<any[]>(); // Emitimos los productos paginados

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updatePageData();
      this.paginator.page.subscribe(() => this.updatePageData()); // Escucha cambios en el paginador
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updatePageData(); // Actualizar datos cuando cambie la lista
    }
  }

  public updatePageData(): void {
    if (!this.data || this.data.length === 0) {
      this.pageData.emit([]);
      return;
    }
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    const pageItems = this.data.slice(startIndex, endIndex);
    this.pageData.emit(pageItems);
  }
}
