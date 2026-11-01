import * as THREE from 'three';
import { FaunaEntity, FaunaSpecies } from '../../types/terrarium';
import { JewelBeetleModel } from './JewelBeetle';
import { PygmyGeckoModel } from './PygmyGecko';
import { AmberSnailModel } from './AmberSnail';
import { SporeMothModel } from './SporeMoth';

export class FaunaManager extends THREE.Group {
  public creatures: (JewelBeetleModel | PygmyGeckoModel | AmberSnailModel | SporeMothModel)[] = [];
  private onCreatureSelect?: (entity: FaunaEntity) => void;

  constructor(onCreatureSelect?: (entity: FaunaEntity) => void) {
    super();
    this.onCreatureSelect = onCreatureSelect;
    this.initDefaultCreatures();
  }

  public initDefaultCreatures() {
    this.clearCreatures();

    const beetle = new JewelBeetleModel('beetle_1', -0.5, 0.4);
    const gecko = new PygmyGeckoModel('gecko_1', 0.6, -0.3);
    const snail = new AmberSnailModel('snail_1', -0.6, -0.5);
    const moth = new SporeMothModel('moth_1', 0.2, 0.4);

    this.addCreature(beetle);
    this.addCreature(gecko);
    this.addCreature(snail);
    this.addCreature(moth);
  }

  public clearCreatures() {
    this.creatures.forEach((c) => this.remove(c));
    this.creatures = [];
  }

  public addCreature(model: JewelBeetleModel | PygmyGeckoModel | AmberSnailModel | SporeMothModel) {
    this.creatures.push(model);
    this.add(model);
  }

  public spawnSpecies(species: FaunaSpecies) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.9;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const id = `${species}_${Date.now()}`;

    let model;
    switch (species) {
      case 'jewel_beetle':
        model = new JewelBeetleModel(id, x, z);
        break;
      case 'pygmy_gecko':
        model = new PygmyGeckoModel(id, x, z);
        break;
      case 'amber_snail':
        model = new AmberSnailModel(id, x, z);
        break;
      case 'spore_moth':
        model = new SporeMothModel(id, x, z);
        break;
    }

    if (model) {
      this.addCreature(model);
      return model.entity;
    }
    return null;
  }

  public update(delta: number) {
    for (let i = 0; i < this.creatures.length; i++) {
      this.creatures[i].update(delta);
    }
  }

  public getRaycastTargets(): THREE.Object3D[] {
    return this.creatures;
  }

  public interactWith(id: string) {
    const target = this.creatures.find((c) => c.entity.id === id);
    if (target) {
      target.interact();
      return target.entity;
    }
    return null;
  }

  public feedCreature(id: string) {
    const target = this.creatures.find((c) => c.entity.id === id);
    if (target) {
      target.entity.hunger = Math.max(0, target.entity.hunger - 40);
      target.entity.energy = Math.min(100, target.entity.energy + 25);
      target.setState('eating');
      return target.entity;
    }
    return null;
  }

  public getEntities(): FaunaEntity[] {
    return this.creatures.map((c) => c.entity);
  }
}
