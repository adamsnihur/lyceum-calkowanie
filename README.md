# Rachunek Całkowy: Od Zera do Poziomu Zaawansowanego

Interaktywne kompendium i traktat pojęciowy z zakresu rachunku całkowego w standardzie **Lyceum Explainer**.

Strona wdrożona na GitHub Pages: [https://adamsnihur.github.io/lyceum-calkowanie/](https://adamsnihur.github.io/lyceum-calkowanie/)

## Ścieżka Dydaktyczna (9 Modułów)

1. **Moduł 01: Dynamiczna Pętla Motion 60 FPS** - silnik ciągłej pulsacji podziałów i akumulacji pola.
2. **Moduł 02: Intuicja Geometryczna (0 &rarr; 1)** - przejście od elementarnych pól i kinematyki do granicy sum Riemanna z badaniem sum lewych, prawych, środkowych i trapezowych.
3. **Moduł 03: Rygor Formalny (1 &rarr; 2)** - Fundamentalne Twierdzenie Rachunku Całkowego (FTC I & II), konstrukcja Darboux (sumy dolne/górne) oraz warunek całkowalności Riemanna.
4. **Moduł 04: Techniki Analityczne & Rzędy Zbieżności (2 &rarr; 3)** - całkowanie przez części, metoda podstawienia oraz laboratoryjne badanie rzędów zbieżności kwadratur ($O(N^{-1})$, $O(N^{-2})$, $O(N^{-4})$).
5. **Moduł 05: Rewolucja Lebesgue'a (3 &rarr; 4)** - kryzys patologii funkcyjnych (funkcja Dirichleta $\mathbf{1}_{\mathbb{Q}}$), cięcie dziedziny $X$ vs cięcie przeciwdziedziny $Y$, miara zbiorów i twierdzenie o zbieżności zmajoryzowanej.
6. **Moduł 06: Formy Różniczkowe & Stokes (Poziom 5: Ekspert)** - uogólnione twierdzenie Stokesa $\int_{\partial \Omega} \omega = \int_{\Omega} d\omega$ integrujące FTC, Greena, Stokesa 3D i Gaussa-Ostrogradskiego; wprowadzenie do całki stochastycznej Itô i Monte Carlo w wysokich wymiarach.
7. **Moduł 07: Quiz Diagnostyczny** - interaktywny sprawdzian 5 pytań z natychmiastowym feedbackiem.
8. **Moduł 08: Implementacja Python** - referencyjny kod w NumPy/SciPy zgodny z protokołem ScientistTwo.
9. **Moduł 09: Źródła Pierwotne & Bibliografia DOI** - literatura naukowa z baz OpenAlex i arXiv.

## Uruchomienie i Testy

```bash
# Testy Playwright (0 błędów konsoli, multi-viewport, text clipping)
./.venv312/bin/python Lyceum/calkowanie/verify_site.py

# Render klipu wideo MP4 1080p 60fps
./.venv312/bin/python Lyceum/calkowanie/render_video.py
```
