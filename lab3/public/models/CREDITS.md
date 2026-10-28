# Model credits

Both models come from the Khronos glTF Sample Assets (https://github.com/KhronosGroup/glTF-Sample-Assets).

- **sofa.glb**: "Sheen Wood Leather Sofa" (https://github.khronos.org/glTF-Assets/model/SheenWoodLeatherSofa).
  (c) 2024 Darmstadt Graphics Group GmbH, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Eric Chadwick for improvements.
  Original asset (c) 2021 Fran Calvente, CC0 (Polyhaven, sofa_03).
- **car.glb**: "Car Concept" (https://github.khronos.org/glTF-Assets/model/CarConcept).
  (c) 2024 Darmstadt Graphics Group GmbH, CC BY 4.0. Eric Chadwick for model and textures.
  Started from a public domain model by Unity Fan (Sketchfab, CC0).

Changes for this course: textures resized to at most 1024 px and stored as WebP, and the geometry compressed with meshopt
(gltf-transform optimize), so that each file is under 2 MB instead of about 10 MB. The shapes and units are unchanged.

Real-world size check (glTF units are metres; bounding boxes of the files in this folder):

| Model | Width (x) | Height (y) | Depth or length (z) |
|---|---|---|---|
| sofa.glb | 2.73 m | 1.12 m | 0.92 m |
| car.glb | 2.54 m | 1.15 m | 4.36 m |

Both sit on the floor (lowest point at y = 0) and are used at their authored size, with no scaling.
