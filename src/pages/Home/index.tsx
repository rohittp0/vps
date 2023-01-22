import Button from "@mui/material/Button";
import * as THREE from "three";

import {useRef, useState} from "react";
import {createGeometryFromPolygon, getPlaneMaterial, getRenderer, getScene, initGL} from "./utils";


export default function Home()
{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [running, setRunning] = useState(false);

    const camera = new THREE.PerspectiveCamera();
    const scene = getScene();
    const allPlanes = new Map();

    const greenPlaneMaterial = getPlaneMaterial(new THREE.Color(0, 255, 0));
    // const redPlaneMaterial = getPlaneMaterial(new THREE.Color(0, 255, 0));

    const reticule = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );

    let referenceSpace: XRReferenceSpace | XRBoundedReferenceSpace;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null;
    let renderer: THREE.WebGLRenderer;

    let hitTestSource: XRHitTestSource | undefined;

    reticule.visible = false;
    scene.add(reticule);
    camera.matrixAutoUpdate = false;

    async function initWebXr(canvas: HTMLCanvasElement)
    {
        const session = await navigator.xr?.requestSession(
            "immersive-ar",
            {requiredFeatures: ["hit-test", "anchors", "plane-detection"]}
        );
        gl = initGL(canvas);

        if (!gl || !session?.requestHitTestSource)
            return;


        session.addEventListener("select", () =>
        {
            console.log(reticule.matrix);
        });

        renderer = getRenderer(canvas, gl);

        session.addEventListener("end", () => setRunning(false));
        await session.updateRenderState({baseLayer: new XRWebGLLayer(session, gl)});
        referenceSpace = await session.requestReferenceSpace("local");

        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session.requestHitTestSource({space: viewerSpace});

        session.requestAnimationFrame(onXRFrame as FrameRequestCallback);
        setRunning(true);
    }

    function processPlanes(timestamp: number, frame: XRFrame & {detectedPlanes: Set<XRPlane> })
    {
        if (!frame.detectedPlanes)
            return;

        allPlanes.forEach((planeContext, plane) =>
        {
            if (!frame.detectedPlanes.has(plane))
            {
                // plane was removed
                allPlanes.delete(plane);
                scene.remove(planeContext.mesh);
            }
        });

        frame.detectedPlanes.forEach((plane: XRPlane) =>
        {
            const planePose = frame.getPose(plane.planeSpace, referenceSpace);
            let planeMesh;

            if (allPlanes.has(plane))
            {
                // may have been updated:
                const planeContext = allPlanes.get(plane);
                planeMesh = planeContext.mesh;

                if (planeContext.timestamp < plane.lastChangedTime)
                {
                    // updated!
                    planeContext.timestamp = plane.lastChangedTime;

                    const geometry = createGeometryFromPolygon(plane.polygon);
                    planeContext.mesh.geometry.dispose();
                    planeContext.mesh.geometry = geometry;
                }
            }
            else
            {
                // new plane

                // Create geometry:
                const geometry = createGeometryFromPolygon(plane.polygon);
                planeMesh = new THREE.Mesh(geometry, greenPlaneMaterial);

                planeMesh.matrixAutoUpdate = false;

                scene.add(planeMesh);

                const planeContext = {
                    id: allPlanes.size,
                    timestamp: plane.lastChangedTime,
                    mesh: planeMesh,
                };

                allPlanes.set(plane, planeContext);
            }

            if (planePose)
            {
                planeMesh.visible = true;
                planeMesh.matrix.fromArray(planePose.transform.matrix);
            }
            else
                planeMesh.visible = false;

        });
    }

    function onXRFrame(t: DOMHighResTimeStamp, frame: XRFrame)
    {
        if (!gl || !referenceSpace || !hitTestSource)
            return;

        processPlanes(t, frame as XRFrame & {detectedPlanes: Set<XRPlane> });

        const session = frame.session;
        session.requestAnimationFrame(onXRFrame);

        // Bind the graphics framebuffer to the baseLayer's framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState?.baseLayer?.framebuffer || null);

        const hitPose = frame.getHitTestResults(hitTestSource)[0]?.getPose(referenceSpace);
        if (hitPose && reticule)
        {
            reticule.visible = true;
            reticule.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
            reticule.updateMatrixWorld(true);
        }
        // Retrieve the pose of the device.
        // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
        const pose = frame.getViewerPose(referenceSpace);
        if (pose)
        {
            // In mobile AR, we only have one view.
            const view = pose.views[0];

            const viewport = session.renderState?.baseLayer?.getViewport(view);
            if(viewport)
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
