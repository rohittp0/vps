import * as THREE from "three";

export function initGL(canvas: HTMLCanvasElement)
{
    function onResize()
    {
        canvas.width = canvas.clientWidth * window.devicePixelRatio;
        canvas.height = canvas.clientHeight * window.devicePixelRatio;
    }

    window.addEventListener("resize", onResize);
    onResize();

    return canvas.getContext("webgl", {xrCompatible: true});
}

export function getScene()
{
    const scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    return scene;
}

export function getRenderer(canvas: HTMLCanvasElement, gl: WebGLRenderingContext)
{
    // Set up the WebGLRenderer, which handles rendering to the session's base layer.
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        preserveDrawingBuffer: true,
        canvas: canvas,
        context: gl
    });
    renderer.autoClear = false;

    return renderer;
}

export function getPlaneMaterial(color: THREE.Color)
{
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    const gridTexture = loader.load("https://raw.githubusercontent.com/google-ar/arcore-android-sdk/c684bbda37e44099c273c3e5274fae6fccee293c/samples/hello_ar_c/app/src/main/assets/models/trigrid.png");
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;

    return new THREE.MeshBasicMaterial({
        color,
        map: gridTexture,
        opacity: 0.5,
        transparent: true,
    });
}

export function createGeometryFromPolygon(polygon: { x: number, y: number, z: number }[])
{
    const geometry = new THREE.BufferGeometry();

    const vertices: Array<number> = [];
    const uvs: Array<number> = [];
    polygon.forEach(point =>
    {
        vertices.push(point.x, point.y, point.z);
        uvs.push(point.x, point.z);
    });

    const indices = [];
    for (let i = 2; i < polygon.length; ++i)

        indices.push(0, i - 1, i);



    geometry.setAttribute("position",
        new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute("uv",
        new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setIndex(indices);

    return geometry;
}
