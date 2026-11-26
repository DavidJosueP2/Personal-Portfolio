# CV de David Barragán

El contenido en español se edita en `david-barragan-cv-es.tex` y el contenido en inglés en `david-barragan-cv-en.tex`. Ambos usan el diseño y los enlaces comunes de `portfolio-cv.sty`.

Para regenerar el CV, instala Georgia en el sistema y TeX Live o MiKTeX con XeLaTeX y los paquetes `fontspec`, `tex-gyre`, `babel` (inglés y español), `microtype`, `geometry`, `enumitem`, `xcolor` e `hyperref`.

## Compilar en VS Code

Abre el archivo `.tex` del idioma que quieres generar y usa el botón de compilación de LaTeX Workshop. Ambos archivos indican que se use la receta `latexmk (xelatex)`. Si eliges manualmente una receta en LaTeX Workshop, selecciona `latexmk (xelatex)` para cargar Georgia con `fontspec`.

Git ignora los auxiliares y los PDF de la compilación local en `cv/`. Los PDF que se sirven en el portafolio están en `src/assets/docs/`.

## Actualizar los PDF del portafolio

Ejecuta este comando desde la raíz del repositorio.

```sh
npm run cv:build
```

Si ambos CV compilan en una página, el comando actualiza los dos PDF en `src/assets/docs/`. Incluye los PDF actualizados junto con los cambios en los archivos LaTeX. El botón CV abre el PDF del idioma activo en otra pestaña. La compilación del sitio usa los PDF ya generados.
