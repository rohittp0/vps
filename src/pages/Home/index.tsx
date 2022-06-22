import Button from "@mui/material/Button";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import {useRef, useState} from "react";


function initGL(canvas: HTMLCanvasElement)
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

function getScene()
{
    const scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    return scene;
}

function getRenderer(canvas: HTMLCanvasElement, gl: WebGLRenderingContext)
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

export default function Home()
{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [running, setRunning] = useState(false);

    const camera = new THREE.PerspectiveCamera();
    const scene = getScene();
    const loader = new GLTFLoader();

    let referenceSpace: XRReferenceSpace | XRBoundedReferenceSpace;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null;
    let renderer: THREE.WebGLRenderer;

    let reticle: THREE.Object3D<THREE.Event> | THREE.Group, flower: THREE.Group;
    let hitTestSource: XRHitTestSource | undefined;

    loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", (gltf) =>
    {
        reticle = gltf.scene;
        reticle.visible = false;
        scene.add(reticle);
    });

    loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf",
        (gltf) => flower = gltf.scene);

    camera.matrixAutoUpdate = false;

    async function initWebXr(canvas: HTMLCanvasElement)
    {
        const session = await navigator.xr.requestSession(
            "immersive-ar",
            {requiredFeatures: ["hit-test", "anchors"]}
        );
        gl = initGL(canvas);

        if(!gl || !session.requestHitTestSource)
            return;

        session.addEventListener("select", () =>
        {
            if (flower)
            {
                const clone = flower.clone();
                clone.position.copy(reticle.position);
                scene.add(clone);
            }
        });

        renderer = getRenderer(canvas, gl);

        session.addEventListener("end", () => setRunning(false));
        await session.updateRenderState({baseLayer: new XRWebGLLayer(session, gl)});
        referenceSpace = await session.requestReferenceSpace("local");

        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

        session.requestAnimationFrame(onXRFrame as FrameRequestCallback);
        setRunning(true);
    }

    function onXRFrame(t: DOMHighResTimeStamp, frame)
    {
        if(!gl || !referenceSpace || !hitTestSource)
            return;

        const session = frame.session;
        session.requestAnimationFrame(onXRFrame);

        // Bind the graphics framebuffer to the baseLayer's framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0 && reticle)
        {
            const hitPose = hitTestResults[0].getPose(referenceSpace);
            reticle.visible = true;
            reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
            reticle.updateMatrixWorld(true);
        }
        // Retrieve the pose of the device.
        // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
        const pose = frame.getViewerPose(referenceSpace);
        if (pose)
        {
            // In mobile AR, we only have one view.
            const view = pose.views[0];

            const viewport = session.renderState.baseLayer.getViewport(view);
            renderer.setSize(viewport.width, viewport.height);

            // Use the view's transform matrix and projection matrix to configure the THREE.camera.
            camera.matrix.fromArray(view.transform.matrix);
            camera.projectionMatrix.fromArray(view.projectionMatrix);
            camera.updateMatrixWorld(true);

            // Render the scene with THREE.WebGLRenderer.
            renderer.render(scene, camera);
        }
    }

    return (
        <>
            {!running && <Button onClick={() => initWebXr(canvasRef.current as HTMLCanvasElement)}>
                Start Mapping
            </Button>}
            <canvas ref={canvasRef} width={"100vw"} height={"100vh"}></canvas>
        </>
    );
}
