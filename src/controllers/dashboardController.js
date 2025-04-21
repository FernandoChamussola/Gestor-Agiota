import  {getDashboard}  from "../model/dashboardModel.js";

async function getDashboardController(req, res) {
    const { id } = req.params;
    const dashboard = await getDashboard(id);
    console.log(dashboard);
    res.status(200).json(dashboard);
}

export { getDashboardController };