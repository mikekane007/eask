import { Injector, runInInjectionContext } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCRA } from './cities/accra';
import { GameService } from './game.service';
import { I18n } from './i18n/i18n.service';
import type { Quality } from './types';

const PEOPLE = ACCRA.people;
const PLACES = ACCRA.places;

/** A service with the test language fixed to English and Accra selected. */
function makeService(cityId = 'accra'): GameService {
  const injector = Injector.create({ providers: [{ provide: I18n, useClass: I18n }] });
  const svc = runInInjectionContext(injector, () => new GameService());
  svc.selectCity(cityId);
  return svc;
}

const person = (id: string) => {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) throw new Error(`no person ${id}`);
  return p;
};
const place = (id: string) => {
  const p = PLACES.find((x) => x.id === id);
  if (!p) throw new Error(`no place ${id}`);
  return p;
};

/** Answers the current round with the first choice of the given quality. */
function answerWith(svc: GameService, quality: Quality): void {
  const t = svc.talking();
  if (!t) throw new Error('not talking');
  const a = t.choices.find((c) => c[1] === quality);
  if (!a) throw new Error(`no ${quality} answer`);
  svc.answer(a);
}

/** Plays a whole conversation answering every round with `quality`. */
function playThrough(svc: GameService, quality: Quality): void {
  for (let guard = 0; guard < 10 && svc.talking()?.phase !== 'result'; guard++) {
    const t = svc.talking();
    if (t?.phase === 'question') answerWith(svc, quality);
    else svc.next();
  }
}

describe('GameService', () => {
  let svc: GameService;

  beforeEach(() => {
    localStorage.clear();
    svc = makeService();
  });

  describe('new game', () => {
    it('starts at 07:00 on day 1 with the documented stats', () => {
      const s = svc.state();
      expect([s.hour, s.day, s.body, s.word]).toEqual([7, 1, 80, 10]);
    });

    it('spawns the player next to home, not at the map origin', () => {
      const s = svc.state();
      expect(s.x !== 0 || s.z !== 0).toBe(true);
    });

    it('shows a dash for accuracy until an answer is given', () => {
      expect(svc.accuracy()).toBe('–');
    });
  });

  describe('approaching people', () => {
    it('blocks people whose Word requirement is not met', () => {
      expect(svc.approachBlock(person('efua'))).toContain('Word reaches 15');
    });

    it('blocks conversations after 21:00 and before 07:00', () => {
      svc.patch({ hour: 21 });
      expect(svc.approachBlock(person('kwame'))).toContain('too late');
      svc.patch({ hour: 3 });
      expect(svc.approachBlock(person('kwame'))).toContain('too late');
    });

    it('blocks conversations when energy is below 15', () => {
      svc.patch({ body: 14 });
      expect(svc.approachBlock(person('kwame'))).toContain('too tired');
    });

    it('allows a rested player to talk to the first person', () => {
      expect(svc.approachBlock(person('kwame'))).toBe('');
    });
  });

  describe('conversations', () => {
    it('costs one hour and 8 energy to start (plus the hourly drain)', () => {
      svc.startTalk(person('kwame'));
      const s = svc.state();
      expect(s.hour).toBe(8);
      expect(s.body).toBe(80 - 1.5 - 8);
      expect(svc.talking()?.open).toBe(50);
    });

    it('offers exactly the three answers for the round, shuffled but complete', () => {
      svc.startTalk(person('kwame'));
      const qualities = svc
        .talking()
        ?.choices.map((c) => c[1])
        .sort();
      expect(qualities).toEqual(['bad', 'good', 'ok']);
    });

    it('rewards a good answer with openness and Word, and counts accuracy', () => {
      svc.startTalk(person('kwame'));
      const word = svc.state().word;
      answerWith(svc, 'good');
      expect(svc.talking()?.open).toBe(68);
      expect(svc.state().word).toBeCloseTo(word + 2);
      expect(svc.accuracy()).toBe('100%');
    });

    it('penalises a bad answer and gives no Word', () => {
      svc.startTalk(person('kwame'));
      const word = svc.state().word;
      answerWith(svc, 'bad');
      expect(svc.talking()?.open).toBe(25);
      expect(svc.state().word).toBe(word);
    });

    it('ends in "Wants to follow Jesus" after three wise answers', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'good');
      expect(svc.talking()?.outcome).toBe('open');
      expect(svc.state().best['kwame']).toBe('open');
    });

    it('ends early with "Walked away" when openness hits zero', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'bad');
      const t = svc.talking();
      expect(t?.outcome).toBe('away');
      expect(t?.log).toHaveLength(2);
    });

    it('never downgrades a better earlier outcome', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'good');
      svc.done();
      svc.patch({ hour: 9, body: 80 });
      svc.startTalk(person('kwame'));
      playThrough(svc, 'bad');
      expect(svc.state().best['kwame']).toBe('open');
    });

    it('clears the sheet when the player returns to the street', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'good');
      svc.done();
      expect(svc.talking()).toBeNull();
      expect(svc.sheetVisible()).toBe(false);
    });
  });

  describe('places', () => {
    it('reports a closed chapel at night', () => {
      svc.patch({ hour: 3 });
      const study = place('church').opts?.[0];
      expect(study && svc.placeClosedReason(study, place('church'))).toBe('Closed now, opens 06:00');
    });

    it('needs Word 20 for evangelism training', () => {
      const training = place('church').opts?.[1];
      expect(training && svc.placeClosedReason(training, place('church'))).toBe('Needs Word 20');
    });

    it('Bible study grows Word and spends time and energy', () => {
      const study = place('church').opts?.[0];
      if (!study) throw new Error('missing option');
      svc.usePlaceOption(study);
      const s = svc.state();
      expect(s.hour).toBe(9);
      expect(s.word).toBeCloseTo(10 + 12 - 0.4);
      expect(s.body).toBeCloseTo(80 - 3 - 5);
    });

    it('sleeping restores energy, resets to 07:00 and advances the day after 07:00', () => {
      const sleep = place('home').opts?.[0];
      if (!sleep) throw new Error('missing option');
      svc.patch({ body: 5, hour: 20 });
      svc.usePlaceOption(sleep);
      const s = svc.state();
      expect([s.body, s.hour, s.day]).toEqual([100, 7, 2]);
    });

    it('collapses at zero energy: wakes at home with 45 energy after ten hours', () => {
      const study = place('church').opts?.[0];
      if (!study) throw new Error('missing option');
      const teleport = vi.fn();
      svc.teleport = teleport;
      svc.patch({ body: 4 });
      svc.usePlaceOption(study);
      expect(teleport).toHaveBeenCalledOnce();
      expect(svc.state().body).toBeCloseTo(45 - 15);
    });
  });

  describe('persistence', () => {
    it('restores progress in a new session', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'good');
      const reloaded = makeService();
      expect(reloaded.state().best['kwame']).toBe('open');
      expect(reloaded.state().word).toBe(svc.state().word);
    });

    it('ignores corrupt saved data and starts fresh', () => {
      localStorage.setItem('goandtell:accra', '{not json');
      expect(makeService().state().day).toBe(1);
    });

    it('fills in fields missing from an older save', () => {
      localStorage.setItem('goandtell:accra', JSON.stringify({ word: 30, body: 60 }));
      const s = makeService().state();
      expect([s.word, s.body, s.day, s.hour]).toEqual([30, 60, 1, 7]);
    });

    it('"Start over" wipes progress', () => {
      svc.startTalk(person('kwame'));
      playThrough(svc, 'good');
      svc.reset();
      expect(svc.state().best).toEqual({});
      expect(svc.state().total).toBe(0);
    });
  });
});
