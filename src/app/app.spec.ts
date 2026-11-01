import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '' })
class EmptyPage {}

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let el: HTMLElement;

  const main = (): HTMLElement => el.querySelector<HTMLElement>('#main-content')!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'a', component: EmptyPage },
          { path: 'b', component: EmptyPage },
        ]),
      ],
    });
    fixture = TestBed.createComponent(App);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    await fixture.whenStable();
  });

  afterEach(() => el.remove());

  it('exposes the header, main and footer landmarks', () => {
    expect(el.querySelector('header')).not.toBeNull();
    expect(main().tagName).toBe('MAIN');
    expect(el.querySelector('footer')).not.toBeNull();
  });

  it('moves focus to the main content from the skip link', () => {
    el.querySelector<HTMLElement>('.skip-link')!.click();

    expect(document.activeElement).toBe(main());
  });

  it('keeps focus untouched on the first navigation', async () => {
    await TestBed.inject(Router).navigateByUrl('/a');

    expect(document.activeElement).not.toBe(main());
  });

  it('moves focus to the main content on later navigations', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/a');
    await router.navigateByUrl('/b');

    expect(document.activeElement).toBe(main());
  });
});
