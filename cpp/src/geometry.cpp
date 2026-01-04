// Part of the Chili3d Project, under the AGPL-3.0 License.
// See LICENSE file in the project root for full license information.

#include <GCPnts_AbscissaPoint.hxx>
#include <GCPnts_UniformAbscissa.hxx>
#include <GeomAPI_ExtremaCurveCurve.hxx>
#include <GeomAPI_ProjectPointOnCurve.hxx>
#include <GeomAPI_ProjectPointOnSurf.hxx>
#include <GeomLib_IsPlanarSurface.hxx>
#include <GeomLib_Tool.hxx>
#include <GeomProjLib.hxx>
#include <Geom_Curve.hxx>
#include <Geom_Line.hxx>
#include <Geom_Surface.hxx>
#include <Geom_TrimmedCurve.hxx>
#include <Standard_Handle.hxx>
#include <cmath>
#include <gp_Dir.hxx>
#include <gp_Pnt.hxx>
#include <optional>

#include "shared.hpp"
#include "utils.hpp"

using namespace emscripten;

class Curve {
private:
    static Vector3Array getPoints(const GCPnts_UniformAbscissa& uniformAbscissa, const Geom_Curve* curve)
    {
        std::vector<Vector3> points;
        for (int i = 1; i <= uniformAbscissa.NbPoints(); i++) {
            points.push_back(Vector3::fromPnt(curve->Value(uniformAbscissa.Parameter(i))));
        }
        return Vector3Array(val::array(points));
    }

public:
    static Handle_Geom_Line makeLine(const Vector3& start, const Vector3& dir)
    {
        Handle_Geom_Line line = new Geom_Line(Vector3::toPnt(start), Vector3::toDir(dir));
        return line;
    }

    static Handle_Geom_TrimmedCurve trim(const Geom_Curve* curve, double start, double end)
    {
        Handle_Geom_TrimmedCurve trimmedCurve = new Geom_TrimmedCurve(curve, start, end);
        return trimmedCurve;
    }

    static Vector3Array projects(const Geom_Curve* curve, const Vector3& point)
    {
        GeomAPI_ProjectPointOnCurve projector(Vector3::toPnt(point), curve);
        std::vector<Vector3> points;
        for (int i = 1; i <= projector.NbPoints(); i++) {
            points.push_back(Vector3::fromPnt(projector.Point(i)));
        }

        return Vector3Array(val::array(points));
    }

    static std::optional<ExtremaCCResult> nearestExtremaCC(const Geom_Curve* curve1, const Geom_Curve* curve2)
    {
        GeomAPI_ExtremaCurveCurve extrema(curve1, curve2);
        if (extrema.NbExtrema() == 0) {
            return std::nullopt;
        }

        gp_Pnt p1, p2;
        extrema.NearestPoints(p1, p2);
        double u1, u2;
        extrema.LowerDistanceParameters(u1, u2);
        return ExtremaCCResult { .isParallel = extrema.IsParallel(),
            .distance = extrema.LowerDistance(),
            .p1 = Vector3::fromPnt(p1),
            .p2 = Vector3::fromPnt(p2),
            .u1 = u1,
            .u2 = u2 };
    }

    static Vector3Array uniformAbscissaWithLength(const Geom_Curve* curve, double length)
    {
        GeomAdaptor_Curve adaptorCurve(curve);
        GCPnts_UniformAbscissa uniformAbscissa(adaptorCurve, length);
        return getPoints(uniformAbscissa, curve);
    }

    static Vector3Array uniformAbscissaWithCount(const Geom_Curve* curve, int nbPoints)
    {
        GeomAdaptor_Curve adaptorCurve(curve);
        GCPnts_UniformAbscissa uniformAbscissa(adaptorCurve, nbPoints);
        return getPoints(uniformAbscissa, curve);
    }

    static ProjectPointResult projectOrNearest(const Geom_Curve* curve, const Vector3& point)
    {
        gp_Pnt pnt = Vector3::toPnt(point);
        return projectOrNearestCP(curve, pnt);
    }

    static std::optional<double> parameter(const Geom_Curve* curve, const Vector3& point, double maxDistance)
    {
        double parameter = 0;
        gp_Pnt pnt = Vector3::toPnt(point);
        if (GeomLib_Tool::Parameter(curve, pnt, maxDistance, parameter)) {
            return parameter;
        }
        return std::nullopt;
    }

    static double curveLength(const Geom_Curve* curve)
    {
        GeomAdaptor_Curve adaptorCurve(curve);
        return GCPnts_AbscissaPoint::Length(adaptorCurve);
    }
};

struct HorizontalDimensionResult {
    double value;
    Vector3 p1;
    Vector3 p2;
    Vector3 dimStart;
    Vector3 dimEnd;
    Vector3 text;
};

class Dimension {
private:
    static void projectToPlaneXY(const gp_Ax3& ax3, const Vector3& p, double& x, double& y)
    {
        const gp_Pnt origin = ax3.Location();
        const gp_Pnt point = Vector3::toPnt(p);
        const gp_Vec vec(origin, point);
        const gp_Vec xVec(ax3.XDirection());
        const gp_Vec yVec(ax3.YDirection());
        x = vec.Dot(xVec);
        y = vec.Dot(yVec);
    }

    static Vector3 fromPlaneXY(const gp_Ax3& ax3, double x, double y)
    {
        const gp_Pnt origin = ax3.Location();
        const gp_Vec xVec(ax3.XDirection());
        const gp_Vec yVec(ax3.YDirection());
        const gp_Pnt p = origin.Translated(xVec.Multiplied(x) + yVec.Multiplied(y));
        return Vector3::fromPnt(p);
    }

public:
    static HorizontalDimensionResult horizontal(const Pln& plane, const Vector3& p1, const Vector3& p2, const Vector3& p3)
    {
        const gp_Ax3 ax3 = Pln::toAx3(plane);

        double x1(0), y1(0);
        double x2(0), y2(0);
        double x3(0), y3(0);
        projectToPlaneXY(ax3, p1, x1, y1);
        projectToPlaneXY(ax3, p2, x2, y2);
        projectToPlaneXY(ax3, p3, x3, y3);

        const double dimY = y3;
        const double dimX1 = x1;
        const double dimX2 = x2;

        const Vector3 wp1 = fromPlaneXY(ax3, x1, y1);
        const Vector3 wp2 = fromPlaneXY(ax3, x2, y2);
        const Vector3 wDimStart = fromPlaneXY(ax3, dimX1, dimY);
        const Vector3 wDimEnd = fromPlaneXY(ax3, dimX2, dimY);
        const Vector3 wText = fromPlaneXY(ax3, (dimX1 + dimX2) * 0.5, dimY);

        return HorizontalDimensionResult { .value = std::abs(dimX2 - dimX1),
            .p1 = wp1,
            .p2 = wp2,
            .dimStart = wDimStart,
            .dimEnd = wDimEnd,
            .text = wText };
    }
};

struct SurfaceBounds {
    double u1;
    double u2;
    double v1;
    double v2;
};

class Surface {
public:
    static Handle_Geom_Curve projectCurve(const Geom_Surface* surface, const Geom_Curve* curve)
    {
        return GeomProjLib::Project(curve, surface);
    }

    static Vector3Array projectPoint(const Geom_Surface* surface, const Vector3& point)
    {
        gp_Pnt pnt = Vector3::toPnt(point);
        GeomAPI_ProjectPointOnSurf projector(pnt, surface);
        std::vector<gp_Pnt> points;
        for (size_t i = 0; i < projector.NbPoints(); i++) {
            points.push_back(projector.Point(i + 1));
        }

        return Vector3Array(val::array(points.begin(), points.end()));
    }

    static bool isPlanar(const Geom_Surface* surface)
    {
        GeomLib_IsPlanarSurface isPlanarSurface(surface);
        return isPlanarSurface.IsPlanar();
    }

    static std::optional<UV> parameters(const Geom_Surface* surface, const Vector3& point, double maxDistance)
    {
        double u(0), v(0);
        gp_Pnt pnt = Vector3::toPnt(point);
        if (GeomLib_Tool::Parameters(surface, pnt, maxDistance, u, v)) {
            return UV { .u = u, .v = v };
        }
        return std::nullopt;
    }

    static std::optional<PointAndParameter> nearestPoint(const Geom_Surface* surface, const Vector3& point)
    {
        gp_Pnt pnt = Vector3::toPnt(point);
        GeomAPI_ProjectPointOnSurf projector(pnt, surface);
        if (projector.IsDone()) {
            return PointAndParameter { .point = Vector3::fromPnt(projector.NearestPoint()),
                .parameter = projector.LowerDistance() };
        }
        return std::nullopt;
    }

    static SurfaceBounds bounds(const Geom_Surface* surface)
    {
        double u1, u2, v1, v2;
        surface->Bounds(u1, u2, v1, v2);
        return SurfaceBounds { .u1 = u1, .u2 = u2, .v1 = v1, .v2 = v2 };
    }
};

EMSCRIPTEN_BINDINGS(Geometry)
{
    value_object<HorizontalDimensionResult>("HorizontalDimensionResult")
        .field("value", &HorizontalDimensionResult::value)
        .field("p1", &HorizontalDimensionResult::p1)
        .field("p2", &HorizontalDimensionResult::p2)
        .field("dimStart", &HorizontalDimensionResult::dimStart)
        .field("dimEnd", &HorizontalDimensionResult::dimEnd)
        .field("text", &HorizontalDimensionResult::text);

    class_<Curve>("Curve")
        .class_function("makeLine", &Curve::makeLine)
        .class_function("trim", &Curve::trim, allow_raw_pointers())
        .class_function("projectOrNearest", &Curve::projectOrNearest, allow_raw_pointers())
        .class_function("uniformAbscissaWithCount", &Curve::uniformAbscissaWithCount, allow_raw_pointers())
        .class_function("uniformAbscissaWithLength", &Curve::uniformAbscissaWithLength, allow_raw_pointers())
        .class_function("nearestExtremaCC", &Curve::nearestExtremaCC, allow_raw_pointers())
        .class_function("parameter", &Curve::parameter, allow_raw_pointers())
        .class_function("curveLength", &Curve::curveLength, allow_raw_pointers())
        .class_function("projects", &Curve::projects, allow_raw_pointers());

    class_<Dimension>("Dimension").class_function("horizontal", &Dimension::horizontal);

    value_object<SurfaceBounds>("SurfaceBounds")
        .field("u1", &SurfaceBounds::u1)
        .field("u2", &SurfaceBounds::u2)
        .field("v1", &SurfaceBounds::v1)
        .field("v2", &SurfaceBounds::v2);

    class_<Surface>("Surface")
        .class_function("projectCurve", &Surface::projectCurve, allow_raw_pointers())
        .class_function("projectPoint", &Surface::projectPoint, allow_raw_pointers())
        .class_function("isPlanar", &Surface::isPlanar, allow_raw_pointers())
        .class_function("parameters", &Surface::parameters, allow_raw_pointers())
        .class_function("nearestPoint", &Surface::nearestPoint, allow_raw_pointers())
        .class_function("bounds", &Surface::bounds, allow_raw_pointers());
}
