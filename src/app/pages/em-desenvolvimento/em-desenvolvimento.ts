import {Component,inject} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
@Component({selector:'app-em-desenvolvimento',standalone:true,imports:[RouterLink],template:`<main style="padding:30px;max-width:900px"><h1>{{titulo}}</h1><p>Esta funcionalidade está em desenvolvimento.</p><a routerLink="/afiliacao">Voltar para Conselhos-Praesidia</a></main>`})
export class EmDesenvolvimento {
  private route=inject(ActivatedRoute);
  get titulo(){return this.route.snapshot.data['titulo']??'Em desenvolvimento';}
}
