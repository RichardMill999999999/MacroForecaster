import React from "react";
import axios from "axios";
import TestsController from "./TestsControllers/TestsController";
import HomeController from "./HomeControllers/HomeController";
import WorkController from "./workController/WorkController";
const MasterController = {
    TestsController: TestsController,
    HomeController: HomeController,
    WorkController: WorkController
}
export default MasterController